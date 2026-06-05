"""
Ana orkestrator: soru sec → 3 JPEG uret → Firebase Storage'a yukle →
Instagram Graph API ile Carousel Feed Post yayinla → Firestore log.

Cevre degiskenleri (GitHub Secrets):
  IG_ACCESS_TOKEN          Instagram uzun sureli access token
  IG_USER_ID               Instagram kullanici ID
  FIREBASE_SERVICE_ACCOUNT Firebase service account JSON (single-line stringify)
  FIREBASE_STORAGE_BUCKET  (opsiyonel) ornek: tusoskop.appspot.com
"""
from __future__ import annotations

import json
import os
import random
import sys
import tempfile
import time
import traceback
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

import subprocess
import requests

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
except ImportError:
    print("❌ firebase-admin kurulu degil: pip install firebase-admin")
    sys.exit(1)

try:
    from PIL import Image as PILImage
except ImportError:
    print("❌ Pillow kurulu degil: pip install Pillow")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
QUESTIONS_FILE = SCRIPT_DIR / "questions.json"
QUEUE_COLLECTION = "socialContentQueue"
RECENT_DAYS = 30
IG_API = "https://graph.instagram.com/v21.0"


# ---------------------------------------------------------------------------
# Firebase
# ---------------------------------------------------------------------------
def init_firebase():
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
    if not sa_json:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT env degiskeni bulunamadi")
    sa = json.loads(sa_json)
    project_id = sa.get("project_id", "")
    bucket_name = os.environ.get(
        "FIREBASE_STORAGE_BUCKET", f"{project_id}.appspot.com"
    )
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa)
        firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
    return firestore.client()


def get_recently_used_ids(db, days: int = RECENT_DAYS) -> set[int]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    docs = (
        db.collection(QUEUE_COLLECTION)
        .where("createdAt", ">=", cutoff)
        .stream()
    )
    used = set()
    for doc in docs:
        d = doc.to_dict()
        qid = d.get("sourceQuestionId")
        if qid is not None:
            try:
                used.add(int(qid))
            except (ValueError, TypeError):
                pass
    return used


def question_options(question: dict) -> list[str]:
    if isinstance(question.get("options"), list):
        return [str(x.get("text", x) if isinstance(x, dict) else x).strip()
                for x in question["options"] if str(x).strip()]
    return [
        str(question.get(f"option_{i}", "")).strip()
        for i in range(1, 6)
        if str(question.get(f"option_{i}", "")).strip()
    ]


def correct_index(question: dict) -> int:
    raw = question.get("cevap", question.get("correct", 0))
    if isinstance(raw, str) and raw.upper() in ["A", "B", "C", "D", "E"]:
        return ord(raw.upper()) - ord("A")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def build_visual_spec(question: dict) -> dict:
    opts = question_options(question)
    return {
        "templateType": "question_post",
        "format": "1080x1350",
        "ders": question.get("ders"),
        "konu": question.get("konu"),
        "questionText": question.get("soru") or question.get("q") or "",
        "options": [
            {"letter": chr(ord("A") + i), "text": text}
            for i, text in enumerate(opts)
        ],
    }


def log_to_firestore(db, question: dict, status: str,
                     media_id: str | None = None,
                     error: str | None = None,
                     caption: str | None = None):
    opts = question_options(question)
    c_index = correct_index(question)
    correct_text = opts[c_index] if 0 <= c_index < len(opts) else ""
    doc = {
        "type": "daily_question",
        "status": status,
        "title": f"Günün TUS Sorusu — {question.get('ders', '')}",
        "caption": caption if caption is not None else build_caption(question),
        "hashtags": ["#TUS", "#TUSsınavı", "#TıpSınavı"],
        "sourceQuestionId": question.get("id"),
        "sourceDers": question.get("ders"),
        "sourceKonu": question.get("konu"),
        "answerPayload": {
            "correctIndex": c_index,
            "correctText": correct_text,
            "explanation": question.get("exp", ""),
        },
        "visualMode": "carousel",
        "visualSpec": build_visual_spec(question),
        "carouselSlideCount": 3,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "createdBy": "github-actions",
        "platform": "instagram",
    }
    if media_id:
        doc["publishMeta"] = {"mediaId": media_id}
    if error:
        doc["errorMessage"] = error
    db.collection(QUEUE_COLLECTION).add(doc)


# ---------------------------------------------------------------------------
# Soru secimi
# ---------------------------------------------------------------------------
def load_questions() -> list[dict]:
    if not QUESTIONS_FILE.exists():
        raise FileNotFoundError(f"questions.json bulunamadi: {QUESTIONS_FILE}")
    with open(QUESTIONS_FILE, encoding="utf-8") as f:
        return json.load(f)


def pick_question(questions: list[dict], recently_used: set[int]) -> dict:
    pool = [q for q in questions if int(q.get("id", -1)) not in recently_used]
    if not pool:
        print("⚠ Tum sorular son 30 gunde kullanildi, rastgele seciliyor")
        pool = questions
    return random.choice(pool)


# ---------------------------------------------------------------------------
# Gorsel uretimi (3 slayt)
# ---------------------------------------------------------------------------
def build_carousel_images(question: dict, out_paths: list[str]) -> None:
    question_json = json.dumps(question, ensure_ascii=False)
    result = subprocess.run(
        ["node", "render_post.mjs", question_json, out_paths[0], out_paths[1], out_paths[2]],
        cwd=SCRIPT_DIR,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        if result.stderr:
            print(f"   → render_post stderr: {result.stderr.strip()}")
        raise RuntimeError(f"Carousel render basarisiz (exit code {result.returncode})")
    for path in out_paths:
        size = Path(path).stat().st_size
        print(f"   → {Path(path).name}: {size:,} bytes")
        if size == 0:
            raise RuntimeError(f"Gorsel dosyasi bos: {path}")
        with PILImage.open(path) as img:
            print(f"   → PIL: format={img.format} size={img.size} mode={img.mode}")


# ---------------------------------------------------------------------------
# Firebase Storage
# ---------------------------------------------------------------------------
def upload_to_storage(local_path: str, label: str) -> tuple[str, str]:
    bucket = storage.bucket()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    blob_name = f"carousel-uploads/{timestamp}_{uuid.uuid4().hex[:8]}_{label}.jpg"
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(local_path, content_type="image/jpeg")
    blob.make_public()
    return blob.public_url, blob_name


def delete_from_storage(blob_name: str) -> None:
    try:
        storage.bucket().blob(blob_name).delete()
        print(f"   → Storage temizlendi: {blob_name}")
    except Exception as e:
        print(f"⚠ Storage temizleme hatasi: {e}")


# ---------------------------------------------------------------------------
# Instagram Graph API — Carousel
# ---------------------------------------------------------------------------
def create_image_container(ig_user_id: str, image_url: str, access_token: str) -> str:
    resp = requests.post(
        f"{IG_API}/{ig_user_id}/media",
        data={
            "image_url": image_url,
            "is_carousel_item": "true",
            "access_token": access_token,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"   → IMAGE container hata: {resp.text}")
    resp.raise_for_status()
    container_id = resp.json().get("id")
    if not container_id:
        raise RuntimeError(f"IMAGE container ID alinamadi: {resp.text}")
    return container_id


def create_carousel_container(ig_user_id: str, children: list[str],
                              caption: str, access_token: str) -> str:
    resp = requests.post(
        f"{IG_API}/{ig_user_id}/media",
        data={
            "media_type": "CAROUSEL",
            "children": ",".join(children),
            "caption": caption,
            "access_token": access_token,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"   → CAROUSEL container hata: {resp.text}")
    resp.raise_for_status()
    container_id = resp.json().get("id")
    if not container_id:
        raise RuntimeError(f"CAROUSEL container ID alinamadi: {resp.text}")
    return container_id


def wait_for_container(creation_id: str, access_token: str, max_wait: int = 60) -> None:
    for _ in range(max_wait // 5):
        resp = requests.get(
            f"{IG_API}/{creation_id}",
            params={
                "fields": "status,status_code",
                "access_token": access_token,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status_code") or data.get("status", "")
        print(f"   → Container status: {status}")
        if status == "FINISHED":
            return
        if status in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"Container hatasi: {status} — {data}")
        time.sleep(5)
    raise RuntimeError("Container FINISHED olmadi (timeout 60s)")


def publish_media(ig_user_id: str, creation_id: str, access_token: str) -> str:
    resp = requests.post(
        f"{IG_API}/{ig_user_id}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": access_token,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"   → media_publish hata detay: {resp.text}")
    resp.raise_for_status()
    media_id = resp.json().get("id")
    if not media_id:
        raise RuntimeError(f"media_id alinamadi: {resp.text}")
    return media_id


# ---------------------------------------------------------------------------
# Caption
# ---------------------------------------------------------------------------
def build_caption(question: dict) -> str:
    ders = question.get("ders", "")
    konu = question.get("konu", "")
    exp = question.get("exp", "")

    caption = f"📚 {ders} | {konu}\n\n"
    if exp:
        exp_short = exp[:280] + ("…" if len(exp) > 280 else "")
        caption += f"💡 {exp_short}\n\n"
    caption += "🎯 Günlük TUS pratik soruları için takipte kal!\n"
    caption += "👉 tusoskop.com\n\n"

    ders_tag = "#" + "".join(ders.split())
    konu_tag = "#" + "".join(konu.split())[:20]
    caption += f"#TUS #TUSsınavı #TıpSınavı {ders_tag} {konu_tag}"

    return caption


# ---------------------------------------------------------------------------
# Ana akis
# ---------------------------------------------------------------------------
def main():
    print("=" * 55)
    print(f"Tusoskop Gunluk Carousel Post — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 55)

    access_token = os.environ.get("IG_ACCESS_TOKEN", "")
    ig_user_id = os.environ.get("IG_USER_ID", "")
    if not access_token or not ig_user_id:
        print("❌ IG_ACCESS_TOKEN veya IG_USER_ID eksik")
        sys.exit(1)

    print("🔥 Firebase baglaniyor...")
    db = init_firebase()

    print(f"📋 Son {RECENT_DAYS} gunde kullanilan sorular aliniyor...")
    recently_used = get_recently_used_ids(db)
    print(f"   → {len(recently_used)} soru onceden kullanilmis")

    questions = load_questions()
    print(f"   → {len(questions)} soru bankada")
    question = pick_question(questions, recently_used)
    print(f"✓ Soru: [{question['id']}] {question.get('ders')} / {question.get('konu')}")

    # 3 temp dosya
    tmp_paths = []
    for i in range(3):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_paths.append(tmp.name)

    blob_names: list[str] = []
    try:
        print("🎨 3 slayt gorsel uretiliyor...")
        build_carousel_images(question, tmp_paths)
        print("✓ Gorseller hazir")

        # Upload 3 images
        image_urls = []
        for i, path in enumerate(tmp_paths):
            label = ["soru", "cevap", "promo"][i]
            print(f"☁ Slayt {i+1} yuklenıyor ({label})...")
            url, blob_name = upload_to_storage(path, label)
            image_urls.append(url)
            blob_names.append(blob_name)
            print(f"✓ Yuklendi: {url}")

        # Create 3 IMAGE containers
        print("📦 IMAGE container'lar olusturuluyor...")
        child_ids = []
        for i, url in enumerate(image_urls):
            cid = create_image_container(ig_user_id, url, access_token)
            child_ids.append(cid)
            print(f"   → Slayt {i+1} container: {cid}")

        # Wait for each image container to reach FINISHED before creating carousel
        print("⏳ Image container'lar bekleniyor...")
        for i, cid in enumerate(child_ids):
            wait_for_container(cid, access_token, max_wait=120)
            print(f"   → Slayt {i+1} container hazir")

        # Build caption
        caption = build_caption(question)

        # Create carousel container
        print("📦 CAROUSEL_ALBUM container olusturuluyor...")
        carousel_id = create_carousel_container(ig_user_id, child_ids, caption, access_token)
        print(f"✓ Carousel container: {carousel_id}")

        # Wait for carousel to be ready
        print("⏳ Carousel hazirlaniyor...")
        wait_for_container(carousel_id, access_token)

        # Publish
        print("🚀 Carousel post yayinlaniyor...")
        media_id = publish_media(ig_user_id, carousel_id, access_token)
        print(f"✓ Post yayinlandi! media_id={media_id}")

        log_to_firestore(db, question, "published", media_id=media_id, caption=caption)
        print("✓ Firestore log yazildi")

    except Exception as e:
        print(f"❌ Hata: {e}")
        traceback.print_exc()
        try:
            log_to_firestore(db, question, "failed", error=str(e))
        except Exception as log_err:
            print(f"⚠ Log yazılamadi: {log_err}")
        sys.exit(1)
    finally:
        for path in tmp_paths:
            Path(path).unlink(missing_ok=True)
        for blob_name in blob_names:
            delete_from_storage(blob_name)

    print("=" * 55)
    print("✅ Tamamlandi!")


if __name__ == "__main__":
    main()
