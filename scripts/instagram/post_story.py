"""
Ana orkestratör: soru seç → PNG üret → Instagram Story yayınla → Firestore log.

Çevre değişkenleri (GitHub Secrets):
  IG_USERNAME              Instagram kullanıcı adı
  IG_PASSWORD              Instagram şifresi
  FIREBASE_SERVICE_ACCOUNT Firebase service account JSON (single-line stringify)
  IG_STORY_CAPTION         (opsiyonel) özel caption; yoksa varsayılan oluşturulur
"""

from __future__ import annotations

import json
import os
import random
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Import kontrolleri
# ---------------------------------------------------------------------------
try:
    from instagrapi import Client
    from instagrapi.exceptions import LoginRequired, ChallengeRequired
except ImportError:
    print("❌ instagrapi kurulu değil: pip install instagrapi")
    sys.exit(1)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("❌ firebase-admin kurulu değil: pip install firebase-admin")
    sys.exit(1)

from story_image import generate_story_png

# ---------------------------------------------------------------------------
# Sabitler
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
QUESTIONS_FILE = SCRIPT_DIR / "questions.json"
SESSION_FILE = SCRIPT_DIR / ".ig_session.json"
QUEUE_COLLECTION = "socialContentQueue"
RECENT_DAYS = 30


# ---------------------------------------------------------------------------
# Firebase
# ---------------------------------------------------------------------------
def init_firebase():
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
    if not sa_json:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT env değişkeni bulunamadı")
    sa = json.loads(sa_json)
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def get_recently_used_ids(db, days: int = RECENT_DAYS) -> set[int]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    # Sadece createdAt filtresi — composite index gerekmez
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
# Soru seçimi
# ---------------------------------------------------------------------------
def load_questions() -> list[dict]:
    if not QUESTIONS_FILE.exists():
        raise FileNotFoundError(f"questions.json bulunamadı: {QUESTIONS_FILE}")
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def pick_question(questions: list[dict], recently_used: set[int]) -> dict:
    pool = [q for q in questions if int(q.get("id", -1)) not in recently_used]
    if not pool:
        print("⚠ Tüm sorular son 30 günde kullanıldı, rastgele seçiliyor")
        pool = questions
    return random.choice(pool)


# ---------------------------------------------------------------------------
# Instagram
# ---------------------------------------------------------------------------
def get_instagram_client() -> Client:
    username = os.environ.get("IG_USERNAME", "")
    password = os.environ.get("IG_PASSWORD", "")
    if not username or not password:
        raise RuntimeError("IG_USERNAME veya IG_PASSWORD env değişkeni eksik")

    cl = Client()
    cl.delay_range = [1, 3]

    # Önceki session varsa yükle (ban riskini azaltır)
    if SESSION_FILE.exists():
        try:
            cl.load_settings(str(SESSION_FILE))
            cl.login(username, password)
            cl.get_timeline_feed()  # session geçerli mi kontrol
            print("✓ Mevcut session ile giriş yapıldı")
            return cl
        except Exception:
            print("⚠ Eski session geçersiz, yeniden giriş yapılıyor...")

    cl.login(username, password)
    cl.dump_settings(str(SESSION_FILE))
    print("✓ Instagram'a giriş yapıldı")
    return cl


def post_to_instagram(cl: Client, image_path: str) -> str:
    media = cl.photo_upload_to_story(image_path)
    return str(media.id)


def post_feed(cl: Client, image_path: str, caption: str) -> str:
    """Feed post atmak için (story yerine). Opsiyonel kullanım."""
    media = cl.photo_upload(image_path, caption=caption)
    return str(media.id)


# ---------------------------------------------------------------------------
# Caption
# ---------------------------------------------------------------------------
def build_caption(question: dict) -> str:
    ders = question.get("ders", "TUS")
    konu = question.get("konu", "")
    lines = [
        f"📚 {ders} — {konu}" if konu else f"📚 {ders}",
        "",
        "💬 Cevabını yorum olarak yaz!",
        "",
        "#TUS #TUSsınavı #tıp #tusoskop #gününsoru",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Ana akış
# ---------------------------------------------------------------------------
def main():
    print("=" * 50)
    print(f"🚀 Tusoskop Günlük Story — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    # 1. Firebase başlat
    print("🔥 Firebase bağlanıyor...")
    db = init_firebase()

    # 2. Son kullanılan soruları al
    print(f"📋 Son {RECENT_DAYS} günde kullanılan sorular alınıyor...")
    recently_used = get_recently_used_ids(db)
    print(f"   → {len(recently_used)} soru daha önce kullanılmış")

    # 3. Soru seç
    questions = load_questions()
    print(f"   → {len(questions)} soru bankada")
    question = pick_question(questions, recently_used)
    print(f"✓ Soru seçildi: [{question['id']}] {question.get('ders')} / {question.get('konu')}")

    # 4. PNG üret
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        generate_story_png(question, tmp_path)
        print(f"✓ Story PNG üretildi: {tmp_path}")

        # 5. Instagram'a yükle
        print("📸 Instagram'a bağlanılıyor...")
        cl = get_instagram_client()

        print("🚀 Story yayınlanıyor...")
        media_id = post_to_instagram(cl, tmp_path)
        print(f"✓ Story yayınlandı! media_id={media_id}")

        # 6. Firestore log
        log_to_firestore(db, question, "published", media_id=media_id)
        print("✓ Firestore'a log yazıldı")

    except Exception as e:
        print(f"❌ Hata: {e}")
        try:
            log_to_firestore(db, question, "failed", error=str(e))
        except Exception as log_err:
            print(f"⚠ Log yazılamadı: {log_err}")
        sys.exit(1)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    print("=" * 50)
    print("✅ Tamamlandı!")


if __name__ == "__main__":
    main()
