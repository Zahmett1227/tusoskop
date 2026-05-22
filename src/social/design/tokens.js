import { colors } from "./colors.js";
import { spacing, radius, glow, canvasPad, contentMaxWidth } from "./spacing.js";
import { fonts, typography, fontSizeMin, fontSizeMax } from "./typography.js";
import { glow as glowScale } from "./spacing.js";

export const FORMATS = {
  "1080x1080": { width: 1080, height: 1080, pad: canvasPad.post },
  "1080x1350": { width: 1080, height: 1350, pad: canvasPad.portrait },
  "1080x1920": { width: 1080, height: 1920, pad: canvasPad.story },
};

export const HOOKS = [
  "TUS'ta çok karışan nokta",
  "1 dakikada öğren",
  "Bu bilgi soru getirir",
  "Dikkat: klasik tuzak",
  "Son yıllarda tekrar soruldu",
  "Sık yapılan hata",
  "Klinikte karşına çıkar",
  "Mini ama kritik bilgi",
];

export const CTAS = {
  comment: "Cevabını yorumlara yaz",
  save: "Kaydet · Tekrar et",
  tomorrow: "Yarın cevabı paylaşacağız",
  share: "Arkadaşına gönder",
  app: "Benzer sorular Tusoskop'ta",
  poll: "Bugün kaç soru çözdün?",
  swipe: "Kaydır · cevabı gör",
};

export const tokens = {
  colors,
  spacing,
  radius,
  glow: glowScale,
  canvasPad,
  contentMaxWidth,
  fonts,
  typography,
  fontSizeMin,
  fontSizeMax,
  FORMATS,
  HOOKS,
  CTAS,
};
