"""
TUS Sorusu — Instagram Story PNG üretici (1080×1920).

Kullanım:
  python story_image.py  # test modu: test_story.png üretir

generate_story_png(question, output_path) fonksiyonunu post_story.py çağırır.
"""

from __future__ import annotations

import os
import textwrap
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Dizinler
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
FONTS_DIR = SCRIPT_DIR / "fonts"
BACKGROUNDS_DIR = SCRIPT_DIR / "backgrounds"

# ---------------------------------------------------------------------------
# Boyut sabitleri
# ---------------------------------------------------------------------------
W, H = 1080, 1920
PAD_X = 64          # yatay kenar boşluğu
CONTENT_W = W - PAD_X * 2

# ---------------------------------------------------------------------------
# Renkler (Tusoskop koyu tema)
# ---------------------------------------------------------------------------
BG_COLOR = (1, 2, 9)
OVERLAY_COLOR = (1, 2, 9)
CHIP_BG = (5, 7, 18, 200)
CHIP_BORDER = (10, 181, 166, 120)
SUBJECT_TEXT_COLOR = (45, 212, 191)    # teal accent
KICKER_COLOR = (241, 245, 249)         # near-white
QUESTION_COLOR = (248, 250, 252)
OPTION_BG = (5, 7, 18, 178)
OPTION_BORDER = (30, 41, 59, 180)
OPTION_LETTER_BG = (20, 184, 166)     # teal
OPTION_TEXT_COLOR = (241, 245, 249)
CORRECT_BG = (15, 122, 67, 210)
CORRECT_BORDER = (52, 211, 153)
FOOTER_COLOR = (100, 116, 139)
SHADOW_COLOR = (0, 0, 0, 80)

# ---------------------------------------------------------------------------
# Font yükleme
# ---------------------------------------------------------------------------
def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    is_regular = "Regular" in name
    bold_paths = [
        FONTS_DIR / name,
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"),
    ]
    regular_paths = [
        FONTS_DIR / name,
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
        Path("/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"),
    ]
    for candidate in (regular_paths if is_regular else bold_paths):
        if candidate.exists():
            try:
                return ImageFont.truetype(str(candidate), size)
            except OSError:
                continue
    return ImageFont.load_default()


def get_fonts() -> dict:
    return {
        "chip":    _load_font("Inter-Bold.ttf", 26),
        "kicker":  _load_font("Inter-Bold.ttf", 38),
        "question":_load_font("Inter-Bold.ttf", 40),
        "question_sm": _load_font("Inter-Bold.ttf", 34),
        "option":  _load_font("Inter-Bold.ttf", 26),
        "option_sm": _load_font("Inter-Bold.ttf", 22),
        "letter":  _load_font("Inter-Bold.ttf", 24),
        "footer":  _load_font("Inter-Regular.ttf", 26),
    }


# ---------------------------------------------------------------------------
# Yardımcı çizim fonksiyonları
# ---------------------------------------------------------------------------
def draw_rounded_rect(draw: ImageDraw.ImageDraw, xy: tuple, radius: int,
                      fill=None, outline=None, outline_width: int = 2):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill,
                            outline=outline, width=outline_width)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int,
              draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def draw_text_centered(draw: ImageDraw.ImageDraw, text: str,
                       font: ImageFont.FreeTypeFont, y: int,
                       color: tuple, shadow: bool = False):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    if shadow:
        draw.text((x + 2, y + 2), text, font=font, fill=SHADOW_COLOR)
    draw.text((x, y), text, font=font, fill=color)
    return bbox[3] - bbox[1]  # return height


def load_background(ders: str) -> Image.Image | None:
    """Derse uygun arka plan görselini yükle (PNG veya JPEG)."""
    slug_map = {
        "fizyoloji": "fizyoloji",
        "anatomi": "anatomi",
        "biyokimya": "biyokimya",
        "mikrobiyoloji": "mikrobiyoloji",
        "patoloji": "patoloji",
        "farmakoloji": "farmakoloji",
        "dahiliye": "dahiliye",
        "pediatri": "pediatri",
        "genel cerrahi": "genel-cerrahi",
        "kadın hastalıkları ve doğum": "kadin-dogum",
        "küçük stajlar": "kucuk-stajlar",
    }
    slug = slug_map.get((ders or "").lower().strip(), "dahiliye")
    for ext in [".png", ".jpg", ".jpeg"]:
        p = BACKGROUNDS_DIR / f"{slug}{ext}"
        if p.exists():
            return Image.open(p).convert("RGBA")
    return None


# ---------------------------------------------------------------------------
# Ana üretici
# ---------------------------------------------------------------------------
def generate_story_png(question: dict[str, Any], output_path: str,
                       answer_mode: bool = False,
                       correct_index: int | None = None) -> None:
    """
    question: {id, ders, konu, soru, option_1..5, cevap}
    output_path: çıktı PNG dosya yolu
    answer_mode: True ise doğru cevap slide'ı üretir
    correct_index: 0-4 arası (answer_mode=True iken kullanılır)
    """
    fonts = get_fonts()
    canvas = Image.new("RGBA", (W, H), BG_COLOR + (255,))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Arka plan görseli ---
    bg = load_background(question.get("ders", ""))
    if bg:
        bg = bg.resize((W, H), Image.LANCZOS)
        # Üst %40 daha açık, alt %60 koyu overlay
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay, "RGBA")
        # Üst: hafif karartma
        for i in range(H // 5):
            alpha = int(180 * (1 - i / (H / 5)))
            od.line([(0, i), (W, i)], fill=(1, 2, 9, alpha))
        # Orta bölge: şeffaf (anatomik görsel görünsün)
        # Alt: metin bölgesi için karartma
        for i in range(H):
            ratio = i / H
            if ratio > 0.42:
                alpha = int(210 * ((ratio - 0.42) / 0.58))
                od.line([(0, i), (W, i)], fill=(1, 2, 9, min(alpha, 200)))
        canvas = Image.alpha_composite(
            Image.alpha_composite(canvas.convert("RGBA"), bg),
            overlay
        )
        draw = ImageDraw.Draw(canvas, "RGBA")
    else:
        # Gradient arka plan
        for i in range(H):
            ratio = i / H
            r = int(1 + 8 * ratio)
            g = int(2 + 5 * ratio)
            b = int(9 + 15 * ratio)
            draw.line([(0, i), (W, i)], fill=(r, g, b, 255))

    # --- İçerik alanı (metinler aşağı yarıda) ---
    ders = (question.get("ders") or "TUSOSKOP").upper()
    konu = (question.get("konu") or "").upper()
    soru_text = question.get("soru") or ""

    options_raw = [
        question.get("option_1") or "",
        question.get("option_2") or "",
        question.get("option_3") or "",
        question.get("option_4") or "",
        question.get("option_5") or "",
    ]
    options = [o for o in options_raw if o.strip()]
    letters = list("ABCDE")

    # Doğru cevap index
    cevap_idx = correct_index if correct_index is not None else (
        int(question.get("cevap", 0)) if question.get("cevap") is not None else 0
    )

    # Y başlangıcı
    y = 850

    # Ders chip
    chip_text = ders
    chip_font = fonts["chip"]
    chip_bbox = draw.textbbox((0, 0), chip_text, font=chip_font)
    chip_w = chip_bbox[2] - chip_bbox[0] + 56
    chip_h = 48
    chip_x = (W - chip_w) // 2
    draw_rounded_rect(draw, (chip_x, y, chip_x + chip_w, y + chip_h),
                      radius=24, fill=CHIP_BG, outline=CHIP_BORDER, outline_width=2)
    draw.text((chip_x + 28, y + (chip_h - (chip_bbox[3] - chip_bbox[1])) // 2),
              chip_text, font=chip_font, fill=SUBJECT_TEXT_COLOR)
    y += chip_h + 20

    # Konu (varsa)
    if konu and konu != ders:
        konu_font = fonts["chip"]
        konu_bbox = draw.textbbox((0, 0), konu, font=konu_font)
        konu_x = (W - (konu_bbox[2] - konu_bbox[0])) // 2
        draw.text((konu_x, y), konu, font=konu_font, fill=(148, 163, 184))
        y += (konu_bbox[3] - konu_bbox[1]) + 12

    # SORU / DOĞRU CEVAP kicker
    kicker = "DOĞRU CEVAP" if answer_mode else "SORU"
    kicker_font = fonts["kicker"]
    draw_text_centered(draw, kicker, kicker_font, y, KICKER_COLOR, shadow=True)
    kicker_bbox = draw.textbbox((0, 0), kicker, font=kicker_font)
    y += (kicker_bbox[3] - kicker_bbox[1]) + 24

    # Soru metni (sadece soru modunda)
    if not answer_mode:
        max_lines = 4 if len(options) >= 5 else 5
        q_font = fonts["question"]
        lines = wrap_text(soru_text, q_font, CONTENT_W, draw)
        if len(lines) > max_lines:
            q_font = fonts["question_sm"]
            lines = wrap_text(soru_text, q_font, CONTENT_W, draw)
        lines = lines[:max_lines]

        q_bbox = draw.textbbox((0, 0), "A", font=q_font)
        line_h = q_bbox[3] - q_bbox[1] + 10
        total_h = len(lines) * line_h
        for i, line in enumerate(lines):
            lbbox = draw.textbbox((0, 0), line, font=q_font)
            lx = (W - (lbbox[2] - lbbox[0])) // 2
            draw.text((lx + 2, y + i * line_h + 2), line, font=q_font, fill=SHADOW_COLOR)
            draw.text((lx, y + i * line_h), line, font=q_font, fill=QUESTION_COLOR)
        y += total_h + 36

    # Seçenekler
    opt_font = fonts["option"]
    letter_font = fonts["letter"]
    opt_start_y = y
    opt_gap = 18
    max_opt_y = H - 80
    opt_h = 86

    # Seçenek yüksekliğini hesapla, sığmazsa küçült
    total_opts_h = len(options) * opt_h + (len(options) - 1) * opt_gap
    if opt_start_y + total_opts_h > max_opt_y:
        opt_h = max(62, (max_opt_y - opt_start_y - (len(options) - 1) * opt_gap) // max(len(options), 1))
        opt_font = fonts["option_sm"]

    for i, opt_text in enumerate(options):
        oy = opt_start_y + i * (opt_h + opt_gap)
        is_correct = answer_mode and i == cevap_idx
        is_wrong = answer_mode and not is_correct

        bg_color = CORRECT_BG if is_correct else (OPTION_BG if not is_wrong else (5, 7, 18, 70))
        border_color = CORRECT_BORDER if is_correct else (OPTION_BORDER[:3] + (OPTION_BORDER[3] if len(OPTION_BORDER) > 3 else 180,))
        text_alpha = 255 if not is_wrong else 100

        draw_rounded_rect(draw,
                          (PAD_X, oy, W - PAD_X, oy + opt_h),
                          radius=14, fill=bg_color,
                          outline=(border_color[0], border_color[1], border_color[2]),
                          outline_width=2)

        # Harf balonu
        letter_size = opt_h - 22
        letter_rect = (PAD_X + 16, oy + 11, PAD_X + 16 + letter_size, oy + 11 + letter_size)
        letter_fill = (34, 197, 94, 200) if is_correct else (20, 184, 166, 180)
        draw_rounded_rect(draw, letter_rect, radius=10, fill=letter_fill)
        ltr = "✓" if is_correct else letters[i]
        ltr_bbox = draw.textbbox((0, 0), ltr, font=letter_font)
        ltr_x = letter_rect[0] + (letter_size - (ltr_bbox[2] - ltr_bbox[0])) // 2
        ltr_y = letter_rect[1] + (letter_size - (ltr_bbox[3] - ltr_bbox[1])) // 2
        draw.text((ltr_x, ltr_y), ltr, font=letter_font, fill=(255, 255, 255))

        # Seçenek metni
        text_x = PAD_X + letter_size + 28
        text_max_w = W - PAD_X - text_x - 16
        opt_lines = wrap_text(opt_text, opt_font, text_max_w, draw)[:2]
        opt_line_h = draw.textbbox((0, 0), "A", font=opt_font)[3] + 4
        text_y = oy + (opt_h - len(opt_lines) * opt_line_h) // 2
        opt_color = (255, 255, 255) if is_correct else (OPTION_TEXT_COLOR[0], OPTION_TEXT_COLOR[1], OPTION_TEXT_COLOR[2], text_alpha)
        for j, ol in enumerate(opt_lines):
            draw.text((text_x, text_y + j * opt_line_h), ol, font=opt_font, fill=opt_color[:3])

    # Footer
    footer = "Cevabını yorumlara yaz · tusoskop.com"
    footer_y = H - 80
    footer_font = fonts["footer"]
    draw_text_centered(draw, footer, footer_font, footer_y, FOOTER_COLOR)

    # Watermark
    wm_font = fonts["chip"]
    draw.text((PAD_X, 60), "TUSOSKOP", font=wm_font, fill=(255, 255, 255, 60))

    # Kaydet — JPEG (Instagram PNG kabul etmiyor)
    canvas.convert("RGB").save(output_path, "JPEG", quality=95)
    print(f"✓ Story JPEG → {output_path}")


# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    test_q = {
        "id": 999,
        "ders": "Fizyoloji",
        "konu": "Böbrek Fizyolojisi",
        "soru": "Aşağıdakilerden hangisi nefronun proksimal tübülünde geri emilen maddelerden biri DEĞİLDİR?",
        "option_1": "Glukoz — SGLT2 taşıyıcısı ile tamamına yakını geri emilir",
        "option_2": "Amino asitler — Na+ bağımlı kotransport ile reabsorbe edilir",
        "option_3": "Kreatinin — proksimal tübülde geri emilmez, aksine sekrete edilir",
        "option_4": "Bikarbonat — karbonik anhidraz ile %80-90 geri emilir",
        "cevap": 2,
    }
    out = SCRIPT_DIR / "test_story.png"
    generate_story_png(test_q, str(out))
    print(f"Test görseli: {out}")

    out_ans = SCRIPT_DIR / "test_story_answer.png"
    generate_story_png(test_q, str(out_ans), answer_mode=True, correct_index=2)
    print(f"Test cevap görseli: {out_ans}")
