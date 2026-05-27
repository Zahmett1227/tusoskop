"""
Ana orkestrator: soru sec → JPEG uret → Firebase Storage'a yukle →
Instagram Graph API ile Story yayinla → Firestore log.

Cevre degiskenleri (GitHub Secrets):
  IG_ACCESS_TOKEN          Instagram uzun sureli access token
  IG_USER_ID               Instagram kullanici ID (graph.instagram.com/me -> id)
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

from story_image import generate_story_png

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


def log_to_firestore(db, question: dict, status: str,
                     media_id: str | None = None,
                     error: str | None = None):
    doc = {
        "type": "story",
        "status": status,
        "sourceQuestionId": question.get("id"),
        "sourceDers": question.get("ders"),
        "sourceKonu": question.get("konu"),
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
# Gorsel uretimi
# ---------------------------------------------------------------------------
def build_story_image(question: dict, output_path: str) -> None:
    generate_story_png(question, output_path)
    size = Path(output_path).stat().st_size
    print(f"   → Dosya boyutu: {size:,} bytes")
    if size == 0:
        raise RuntimeError("Gorsel dosyasi bos (0 bytes)")
    with PILImage.open(output_path) as img:
        print(f"   → PIL: format={img.format} size={img.size} mode={img.mode}")


# ---------------------------------------------------------------------------
# Firebase Storage
# ---------------------------------------------------------------------------
def upload_to_storage(local_path: str) -> tuple[str, str]:
    """Resmi Firebase Storage'a yukle, (public_url, blob_name) domdur."""
    bucket = storage.bucket()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    blob_name = f"story-uploads/{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
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
# Instagram Graph API
# ---------------------------------------------------------------------------
def create_media_container(ig_user_id: str, image_url: str,
                           access_token: str) -> str:
    resp = requests.post(
        f"{IG_API}/{ig_user_id}/media",
        data={
            "image_url": image_url,
            "media_type": "STORIES",
            "access_token": access_token,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"   → Instagram API hata detayi: {resp.text}")
    resp.raise_for_status()
    data = resp.json()
    creation_id = data.get("id")
    if not creation_id:
        raise RuntimeError(f"Container ID alinamadi: {resp.text}")
    return creation_id


def wait_for_container(ig_user_id: str, creation_id: str,
                       access_token: str, max_wait: int = 60) -> None:
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


def publish_media(ig_user_id: str, creation_id: str,
                  access_token: str) -> str:
    resp = requests.post(
        f"{IG_API}/{ig_user_id}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": access_token,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    media_id = data.get("id")
    if not media_id:
        raise RuntimeError(f"media_id alinamadi: {resp.text}")
    return media_id


# ---------------------------------------------------------------------------
# Ana akis
# ---------------------------------------------------------------------------
def main():
    print("=" * 50)
    print(f"Tusoskop Gunluk Story — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

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

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name

    blob_name = None
    try:
        print("🎨 Gorsel uretiliyor...")
        build_story_image(question, tmp_path)
        print("✓ Gorsel hazir")

        print("☁ Firebase Storage'a yukleniyor...")
        image_url, blob_name = upload_to_storage(tmp_path)
        print(f"✓ Yuklendi: {image_url}")

        print("📦 Instagram media container olusturuluyor...")
        creation_id = create_media_container(ig_user_id, image_url, access_token)
        print(f"✓ Container: {creation_id}")

        print("⏳ Container hazirlanıyor...")
        wait_for_container(ig_user_id, creation_id, access_token)

        print("🚀 Story yayinlaniyor...")
        media_id = publish_media(ig_user_id, creation_id, access_token)
        print(f"✓ Story yayinlandi! media_id={media_id}")

        log_to_firestore(db, question, "published", media_id=media_id)
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
        Path(tmp_path).unlink(missing_ok=True)
        if blob_name:
            delete_from_storage(blob_name)

    print("=" * 50)
    print("✅ Tamamlandi!")


if __name__ == "__main__":
    main()
