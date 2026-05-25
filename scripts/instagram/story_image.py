"""
TUS Sorusu — Instagram Story JPEG üretici (1080x1920).
SVG anatomik arka plan + konu bazlı tema renkleri.
"""
from __future__ import annotations

import io
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = Path(__file__).parent
FONTS_DIR = SCRIPT_DIR / "fonts"
REPO_ROOT = SCRIPT_DIR.parent.parent
SVG_BG_DIR = REPO_ROOT / "public" / "social" / "story-backgrounds"

try:
    import cairosvg
    HAS_CAIRO = True
except ImportError:
    HAS_CAIRO = False

W, H = 1080, 1920
PAD_X = 72

# Konu renk temaları (accent rengi)
THEMES: dict[str, tuple[int, int, int]] = {
    "fizyoloji":    (16, 185, 129),
    "anatomi":      (249, 115, 22),
    "biyokimya":    (139, 92, 246),
    "mikrobiyoloji":(34, 197, 94),
    "patoloji":     (239, 68, 68),
    "farmakoloji":  (6, 182, 212),
    "dahiliye":     (20, 184, 166),
    "pediatri":     (236, 72, 153),
    "genel cerrahi":(249, 115, 22),
    "kadın hastalıkları ve doğum": (251, 113, 133),
    "küçük stajlar":(99, 102, 241),
}
DEFAULT_ACCENT = (20, 184, 166)
BG_COLOR = (3, 5, 15)

SVG_SLUG: dict[str, str] = {
    "fizyoloji":    "fizyoloji",
    "anatomi":      "anatomi",
    "biyokimya":    "biyokimya",
    "mikrobiyoloji":"mikrobiyoloji",
    "patoloji":     "patoloji",
    "farmakoloji":  "farmakoloji",
    "dahiliye":     "dahiliye",
    "pediatri":     "pediatri",
    "genel cerrahi":"genel-cerrahi",
    "kadın hastalıkları ve doğum": "kadin-dogum",
    "küçük stajlar":"kucuk-stajlar",
}


# ---------------------------------------------------------------------------
# Yardımcılar
# ---------------------------------------------------------------------------
def get_accent(ders: str) -> tuple[int, int, int]:
    return THEMES.get((ders or "").lower().strip(), DEFAULT_ACCENT)


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
    for p in (regular_paths if is_regular else bold_paths):
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def tw(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def th(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        test = (cur + " " + word).strip()
        if tw(draw, test, font) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [text]


def rr(draw: ImageDraw.ImageDraw, xy, radius: int,
       fill=None, outline=None, width: int = 2):
    draw.rounded_rectangle(xy, radius=radius, fill=fill,
                            outline=outline, width=width)


def cx_text(draw: ImageDraw.ImageDraw, text: str, font, y: int, color):
    x = (W - tw(draw, text, font)) // 2
    draw.text((x, y), text, font=font, fill=color)


# ---------------------------------------------------------------------------
# Arka plan: SVG + overlay
# ---------------------------------------------------------------------------
def _load_svg_bg(ders: str) -> Image.Image | None:
    if not HAS_CAIRO:
        return None
    slug = SVG_SLUG.get((ders or "").lower().strip(), "dahiliye")
    svg_path = SVG_BG_DIR / f"{slug}.svg"
    if not svg_path.exists():
        svg_path = SVG_BG_DIR / "dahiliye.svg"
    if not svg_path.exists():
        return None
    try:
        png_data = cairosvg.svg2png(
            url=str(svg_path),
            output_width=W,
            output_height=H,
        )
        return Image.open(io.BytesIO(png_data)).convert("RGBA")
    except Exception as e:
        print(f"⚠ SVG render hatası: {e}")
        return None


def _make_background(ders: str, accent: tuple[int, int, int]) -> Image.Image:
    ar, ag, ab = accent
    canvas = Image.new("RGBA", (W, H), BG_COLOR + (255,))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # Koyu gradient
    for i in range(H):
        t = i / H
        r = int(3 + 12 * t)
        g = int(5 + 10 * t)
        b = int(15 + 20 * t)
        draw.line([(0, i), (W, i)], fill=(r, g, b, 255))

    # SVG anatomik görseli yükle (üst 55%)
    bg = _load_svg_bg(ders)
    if bg:
        canvas = Image.alpha_composite(canvas, bg)
        draw = ImageDraw.Draw(canvas, "RGBA")
    else:
        # SVG yoksa dekoratif daireler çiz
        for ring in range(0, 90, 5):
            alpha = max(0, int(55 * (1 - ring / 90)))
            draw.ellipse([W - 560 + ring, -360 + ring, W + 160 - ring, 400 - ring],
                         outline=(ar, ag, ab, alpha), width=1)
        for ring in range(0, 60, 5):
            alpha = max(0, int(35 * (1 - ring / 60)))
            draw.ellipse([-200 + ring, 700 + ring, 400 - ring, 1300 - ring],
                         outline=(ar, ag, ab, alpha), width=1)
        for hx in range(0, W, 110):
            for hy in range(0, 1050, 130):
                pts = [(hx + 50 * math.cos(math.pi / 3 * k - math.pi / 6),
                        hy + 50 * math.sin(math.pi / 3 * k - math.pi / 6))
                       for k in range(6)]
                draw.polygon(pts, outline=(ar, ag, ab, 9))

    # Gradient overlay: üst saydamdan alta doğru koyu
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay, "RGBA")
    for i in range(H):
        t = i / H
        if t < 0.12:
            # En üst: orta karartma (logo alanı okunabilsin)
            a = int(160 * (1 - t / 0.12))
        elif t < 0.50:
            # Ortada: SVG görünsün, çok hafif overlay
            a = int(30 + 20 * ((t - 0.12) / 0.38))
        elif t < 0.62:
            # Geçiş
            a = int(50 + 160 * ((t - 0.50) / 0.12))
        else:
            # Alt metin bölgesi: koyu
            a = min(215, int(210 + 5 * ((t - 0.62) / 0.38)))
        od.line([(0, i), (W, i)], fill=(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], a))

    canvas = Image.alpha_composite(canvas, overlay)
    return canvas


# ---------------------------------------------------------------------------
# Ana üretici
# ---------------------------------------------------------------------------
def generate_story_png(question: dict[str, Any], output_path: str,
                       answer_mode: bool = False,
                       correct_index: int | None = None) -> None:
    ders = question.get("ders") or "TUSOSKOP"
    konu = question.get("konu") or ""
    soru_text = question.get("soru") or ""
    options_raw = [question.get(f"option_{i+1}") or "" for i in range(5)]
    options = [o for o in options_raw if o.strip()]
    letters = list("ABCDE")
    cevap_idx = (correct_index if correct_index is not None
                 else int(question.get("cevap") or 0))

    accent = get_accent(ders)
    ar, ag, ab = accent

    canvas = _make_background(ders, accent)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # Fontlar
    f_logo   = _load_font("Inter-Bold.ttf", 30)
    f_tag    = _load_font("Inter-Bold.ttf", 25)
    f_subj   = _load_font("Inter-Bold.ttf", 36)
    f_konu   = _load_font("Inter-Regular.ttf", 26)
    f_label  = _load_font("Inter-Bold.ttf", 32)
    f_q1     = _load_font("Inter-Bold.ttf", 40)
    f_q2     = _load_font("Inter-Bold.ttf", 34)
    f_q3     = _load_font("Inter-Bold.ttf", 28)
    f_opt    = _load_font("Inter-Bold.ttf", 28)
    f_opt_sm = _load_font("Inter-Bold.ttf", 23)
    f_letter = _load_font("Inter-Bold.ttf", 22)
    f_footer = _load_font("Inter-Regular.ttf", 24)

    # ===========================
    # HEADER  (y = 54 … ~230)
    # ===========================
    y = 54

    # TUSOSKOP logo (sol)
    draw.text((PAD_X, y), "TUSOSKOP", font=f_logo,
              fill=(255, 255, 255, 210))

    # Üst sağ chip: GÜNÜN SORUSU
    badge = "GÜNÜN SORUSU"
    bw = tw(draw, badge, f_tag)
    bx = W - PAD_X - bw - 28
    rr(draw, [bx - 14, y - 4, bx + bw + 14, y + 38],
       radius=20, fill=(ar, ag, ab, 45), outline=(ar, ag, ab, 130), width=2)
    draw.text((bx, y + 6), badge, font=f_tag, fill=(ar, ag, ab))
    y += 64

    # Divider
    draw.line([(PAD_X, y), (W - PAD_X, y)], fill=(ar, ag, ab, 90), width=1)
    y += 22

    # Ders adı
    subj_disp = ders.upper()
    cx_text(draw, subj_disp, f_subj, y, (ar, ag, ab))
    y += th(draw, subj_disp, f_subj) + 10

    # Konu
    if konu and konu.lower().strip() != ders.lower().strip():
        konu_disp = konu.upper()
        cx_text(draw, konu_disp, f_konu, y, (148, 163, 184))
        y += th(draw, konu_disp, f_konu) + 8
    y += 12

    # ===========================
    # "SORU" / "DOĞRU CEVAP" pill
    # ===========================
    CONTENT_TOP = 850    # üst kısmı SVG'ye bırak

    y = CONTENT_TOP
    label = "DOĞRU CEVAP" if answer_mode else "SORU"
    lw = tw(draw, label, f_label)
    lpad = 36
    rr(draw,
       [(W - lw) // 2 - lpad, y,
        (W + lw) // 2 + lpad, y + 52],
       radius=26,
       fill=(ar, ag, ab, 30),
       outline=(ar, ag, ab, 100),
       width=2)
    draw.text(((W - lw) // 2, y + 10), label, font=f_label,
              fill=(255, 255, 255, 230))
    y += 70

    # ===========================
    # SORU KARTI
    # ===========================
    if not answer_mode:
        CARD_X = PAD_X - 8
        CARD_W = W - (PAD_X - 8) * 2
        INNER_W = CARD_W - 64

        # Font otomatik küçültme — tam soruyu göster
        q_font = f_q1
        q_lines = wrap(draw, soru_text, q_font, INNER_W)
        lh = th(draw, "A", q_font) + 13
        if len(q_lines) * lh > 340:
            q_font = f_q2
            q_lines = wrap(draw, soru_text, q_font, INNER_W)
            lh = th(draw, "A", q_font) + 12
        if len(q_lines) * lh > 360:
            q_font = f_q3
            q_lines = wrap(draw, soru_text, q_font, INNER_W)
            lh = th(draw, "A", q_font) + 11

        card_h = len(q_lines) * lh + 56
        card_y2 = y + card_h

        rr(draw, [CARD_X, y, CARD_X + CARD_W, card_y2],
           radius=18,
           fill=(8, 12, 38, 210),
           outline=(ar, ag, ab, 70),
           width=2)
        # Sol renkli çubuk
        draw.rounded_rectangle([CARD_X, y, CARD_X + 5, card_y2],
                               radius=3, fill=(ar, ag, ab, 220))

        ty = y + 28
        for line in q_lines:
            draw.text((CARD_X + 32, ty), line, font=q_font,
                      fill=(248, 250, 252))
            ty += lh

        y = card_y2 + 26

    # ===========================
    # SEÇENEKLER
    # ===========================
    OPT_X = PAD_X - 8
    OPT_W = W - (PAD_X - 8) * 2
    FOOTER_TOP = H - 100
    GAP = 14

    n = len(options)
    avail = FOOTER_TOP - y - GAP * (n - 1)
    opt_h = min(108, max(70, avail // max(n, 1)))
    opt_font = f_opt if opt_h >= 88 else f_opt_sm
    pill_size = opt_h - 22
    inner_opt_w = OPT_W - pill_size - 52

    for i, opt_text in enumerate(options):
        oy = y + i * (opt_h + GAP)
        is_correct = answer_mode and i == cevap_idx
        is_wrong = answer_mode and not is_correct

        if is_correct:
            c_fill = (15, 110, 65, 210)
            c_border = (52, 211, 153)
            pill_fill = (34, 197, 94, 230)
        elif is_wrong:
            c_fill = (5, 8, 22, 90)
            c_border = (30, 41, 59)
            pill_fill = (ar // 2, ag // 2, ab // 2, 120)
        else:
            c_fill = (8, 12, 36, 195)
            c_border = (ar, ag, ab)
            pill_fill = (ar, ag, ab, 190)

        rr(draw, [OPT_X, oy, OPT_X + OPT_W, oy + opt_h],
           radius=16, fill=c_fill,
           outline=c_border, width=2)

        px = OPT_X + 14
        py = oy + 11
        rr(draw, [px, py, px + pill_size, py + pill_size],
           radius=12, fill=pill_fill)
        ltr = "✓" if is_correct else letters[i]
        lw2 = tw(draw, ltr, f_letter)
        lh2 = th(draw, ltr, f_letter)
        draw.text((px + (pill_size - lw2) // 2, py + (pill_size - lh2) // 2),
                  ltr, font=f_letter, fill=(255, 255, 255))

        # Seçenek metni
        text_x = px + pill_size + 18
        ol_lines = wrap(draw, opt_text, opt_font, inner_opt_w)[:2]
        ol_lh = th(draw, "A", opt_font) + 5
        total_ol = len(ol_lines) * ol_lh
        ty2 = oy + (opt_h - total_ol) // 2
        t_alpha = 240 if not is_wrong else 80
        for j, ol in enumerate(ol_lines):
            draw.text((text_x, ty2 + j * ol_lh), ol, font=opt_font,
                      fill=(248, 250, 252, t_alpha))

    # ===========================
    # FOOTER
    # ===========================
    footer = "Cevabını yorumlara yaz · tusoskop.com"
    fw = tw(draw, footer, f_footer)
    draw.line([(PAD_X, H - 104), (W - PAD_X, H - 104)],
              fill=(ar, ag, ab, 70), width=1)
    draw.text(((W - fw) // 2, H - 84), footer,
              font=f_footer, fill=(100, 116, 139))

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
        "soru": ("Aşağıdakilerden hangisi nefronun proksimal tübülünde geri emilen "
                 "maddelerden biri DEĞİLDİR? Böbrek işlevleri arasında önemli bir yer "
                 "tutan bu mekanizma hakkında doğru bilgiyi işaretleyiniz."),
        "option_1": "Glukoz — SGLT2 taşıyıcısı ile tamamına yakını geri emilir",
        "option_2": "Amino asitler — Na+ bağımlı kotransport ile reabsorbe edilir",
        "option_3": "Kreatinin — proksimal tübülde geri emilmez, sekrete edilir",
        "option_4": "Bikarbonat — karbonik anhidraz ile %80-90 geri emilir",
        "option_5": "Su — osmotik gradyan ile pasif reabsorpsiyona uğrar",
        "cevap": 2,
    }
    out = SCRIPT_DIR / "test_story.jpg"
    generate_story_png(test_q, str(out))
    print(f"✓ Test görseli: {out}")
