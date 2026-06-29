// Tanı eşleştirme + otomatik tamamlama — Türkçe duyarlı.

// Küçük harfe çevir (TR), boşlukları sadeleştir.
export function norm(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ")
    .trim();
}

// "Katlama": aksan/Türkçe karakterleri sadeleştir → gevşek karşılaştırma.
// (psöriatik ↔ psoriatik, şizofreni ↔ sizofreni)
const FOLD_MAP = { ç: "c", ğ: "g", ı: "i", î: "i", ö: "o", ş: "s", ü: "u", û: "u", â: "a" };
export function fold(s) {
  return norm(s).replace(/[çğıîöşüûâ]/g, (c) => FOLD_MAP[c] || c);
}

// Levenshtein mesafesi (yazım hatası toleransı için).
function lev(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

// Tahmin doğru mu? (tam eşleşme, hata toleransı, anahtar kelime eşleşmesi)
export function isCorrect(guess, answer) {
  const g = fold(guess);
  const a = fold(answer);
  if (!g) return false;
  if (g === a) return true;
  // yazım hatası toleransı: kısa→0, orta→1, uzun→2
  const tol = a.length <= 4 ? 0 : a.length <= 10 ? 1 : 2;
  if (lev(g, a) <= tol) return true;
  // anahtar kelime: "akut apandisit" hedefine "apandisit" kabul
  const words = a.split(" ");
  if (g.length >= 5 && words.includes(g)) return true;
  return false;
}

// Otomatik tamamlama önerileri (öncelik: tam önek > kelime öneki > içerir).
export function suggest(query, dictionary, limit = 6) {
  const q = fold(query);
  if (q.length < 2) return [];
  const scored = [];
  for (const d of dictionary) {
    const fd = fold(d);
    let rank = -1;
    if (fd.startsWith(q)) rank = 0;
    else if (fd.split(" ").some((w) => w.startsWith(q))) rank = 1;
    else if (fd.includes(q)) rank = 2;
    if (rank >= 0) scored.push({ d, rank });
  }
  scored.sort((x, y) => x.rank - y.rank || x.d.localeCompare(y.d, "tr"));
  return scored.slice(0, limit).map((s) => s.d);
}
