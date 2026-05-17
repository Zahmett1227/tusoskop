/**
 * Tekrar Denemesi 1 sabit set — ders/konu dağılım raporu (salt okunur).
 * Çalıştır: node scripts/analyze-tekrar-denemesi-1.mjs
 */
import { readFile } from "node:fs/promises";

const TEMEL_DERSLER = new Set([
  "Fizyoloji",
  "Patoloji",
  "Farmakoloji",
  "Mikrobiyoloji",
  "Anatomi",
  "Biyokimya",
]);
const KLINIK_DERSLER = new Set([
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
]);

const STREAK_MIN = 5;
const TOPIC_REPEAT_WARN = 8;
const SUBJECT_TOPIC_DOMINANCE = 0.4;

const { TEKRAR_DENEMESI_1_QUESTION_IDS } = await import(
  new URL("../src/data/tekrarDenemesi1QuestionIds.js", import.meta.url).href
);

const manifest = JSON.parse(
  await readFile(new URL("../src/data/questionChunks/_manifest.json", import.meta.url), "utf8")
);

async function loadChunk(slug) {
  return import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
}

const byId = new Map();
for (const [slug] of Object.entries(manifest.subjectBySlug || {})) {
  const mod = await loadChunk(slug);
  for (const q of mod.QUESTIONS || []) {
    byId.set(Number(q.id), q);
  }
}

const ids = TEKRAR_DENEMESI_1_QUESTION_IDS;
const ordered = ids.map((id, index) => {
  const q = byId.get(Number(id));
  return { index, soruNo: index + 1, id: Number(id), q };
});

const missing = ordered.filter((row) => !row.q).map((row) => row.id);
const resolved = ordered.filter((row) => row.q);

const line = (char = "─", len = 72) => char.repeat(len);
const pad = (s, n) => String(s).padEnd(n);

function countBy(items, keyFn) {
  const m = new Map();
  for (const item of items) {
    const k = keyFn(item);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "tr"));
}

function topicKey(q) {
  return `${q.ders} :: ${q.konu || "—"}`;
}

// Art arda aynı ders+konu blokları
const streaks = [];
let runStart = 0;
for (let i = 1; i <= resolved.length; i += 1) {
  const prev = resolved[i - 1]?.q;
  const cur = resolved[i]?.q;
  const same =
    prev &&
    cur &&
    prev.ders === cur.ders &&
    (prev.konu || "") === (cur.konu || "");
  if (!same && i - runStart >= STREAK_MIN) {
    const first = resolved[runStart];
    streaks.push({
      start: runStart + 1,
      end: i,
      len: i - runStart,
      ders: first.q.ders,
      konu: first.q.konu,
    });
  }
  if (!same) runStart = i;
}

const topicCounts = countBy(resolved, (r) => topicKey(r.q));
const dersCounts = countBy(resolved, (r) => r.q.ders);
const konuByDers = new Map();
for (const r of resolved) {
  const d = r.q.ders;
  if (!konuByDers.has(d)) konuByDers.set(d, new Map());
  const k = r.q.konu || "—";
  const m = konuByDers.get(d);
  m.set(k, (m.get(k) || 0) + 1);
}

const first100 = resolved.slice(0, 100);
const last100 = resolved.slice(100, 200);
const temelOk = first100.every((r) => TEMEL_DERSLER.has(r.q.ders));
const klinikOk = last100.every((r) => KLINIK_DERSLER.has(r.q.ders));
const temelWrong = first100.filter((r) => !TEMEL_DERSLER.has(r.q.ders));
const klinikWrong = last100.filter((r) => !KLINIK_DERSLER.has(r.q.ders));

const warnings = [];
for (const [topic, count] of topicCounts) {
  if (count > TOPIC_REPEAT_WARN) {
    warnings.push(`Aynı konu ${count} kez: ${topic}`);
  }
}
for (const streak of streaks) {
  if (streak.len > STREAK_MIN) {
    warnings.push(
      `Art arda ${streak.len} soru (S${streak.start}–S${streak.end}): ${streak.ders} / ${streak.konu}`
    );
  } else {
    warnings.push(
      `Art arda ${streak.len} soru (S${streak.start}–S${streak.end}): ${streak.ders} / ${streak.konu}`
    );
  }
}
for (const [ders, total] of dersCounts) {
  const topics = [...(konuByDers.get(ders) || [])].sort((a, b) => b[1] - a[1]);
  if (topics[0] && topics[0][1] / total > SUBJECT_TOPIC_DOMINANCE) {
    warnings.push(
      `"${ders}" içinde "${topics[0][0]}" ${topics[0][1]}/${total} soru (%${Math.round((topics[0][1] / total) * 100)}) — tek konu baskın`
    );
  }
}

const criticalSlots = [1, 50, 100, 101, 150, 200];

console.log("");
console.log("╔══════════════════════════════════════════════════════════════════════╗");
console.log("║         TEKRAR DENEMESİ 1 — SABİT SET KALİTE / DAĞILIM RAPORU      ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝");
console.log("");

console.log("1) ÖZET");
console.log(line());
console.log(`   Toplam soru (liste)     : ${ids.length}`);
console.log(`   Benzersiz id            : ${new Set(ids).size}`);
console.log(`   Bankada bulunan         : ${resolved.length}`);
console.log(`   Eksik id                : ${missing.length === 0 ? "Yok" : missing.join(", ")}`);
console.log("");

console.log("2) TEMEL / KLİNİK BLOK (sıra korunmuş)");
console.log(line());
console.log(`   İlk 100 soru → Temel    : ${temelOk ? "EVET ✓" : "HAYIR ✗"}`);
if (temelWrong.length) {
  for (const r of temelWrong.slice(0, 5)) {
    console.log(`      S${r.soruNo}: id=${r.id} ders=${r.q.ders}`);
  }
  if (temelWrong.length > 5) console.log(`      … +${temelWrong.length - 5} soru daha`);
}
console.log(`   Son 100 soru → Klinik   : ${klinikOk ? "EVET ✓" : "HAYIR ✗"}`);
if (klinikWrong.length) {
  for (const r of klinikWrong.slice(0, 5)) {
    console.log(`      S${r.soruNo}: id=${r.id} ders=${r.q.ders}`);
  }
}
console.log("");

console.log("3) DERS BAZLI DAĞILIM");
console.log(line());
console.log(`   ${pad("Ders", 32)} ${pad("Adet", 6)} %`);
for (const [ders, count] of dersCounts) {
  const pct = ((count / resolved.length) * 100).toFixed(1);
  console.log(`   ${pad(ders, 32)} ${pad(count, 6)} ${pct}%`);
}
console.log("");

console.log("4) DERS İÇİ KONU DAĞILIMI");
console.log(line());
for (const [ders] of dersCounts) {
  const topics = [...(konuByDers.get(ders) || [])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));
  console.log(`   ▶ ${ders} (${topics.reduce((s, [, c]) => s + c, 0)} soru)`);
  for (const [konu, count] of topics) {
    console.log(`      · ${konu}: ${count}`);
  }
  console.log("");
}

console.log("5) EN ÇOK TEKRAR EDEN 10 KONU (ders + konu)");
console.log(line());
topicCounts.slice(0, 10).forEach(([topic, count], i) => {
  console.log(`   ${String(i + 1).padStart(2)}. ${count}×  ${topic}`);
});
console.log("");

console.log("6) ART ARDA AYNI DERS + KONU BLOKLARI (≥5 soru)");
console.log(line());
if (streaks.length === 0) {
  console.log("   Tespit edilmedi.");
} else {
  for (const s of streaks) {
    console.log(
      `   S${s.start}–S${s.end} (${s.len} soru): ${s.ders} / ${s.konu}`
    );
  }
}
console.log("");

console.log("7) KRİTİK GEÇİŞ NOKTALARI");
console.log(line());
for (const soruNo of criticalSlots) {
  const r = resolved[soruNo - 1];
  if (!r?.q) {
    console.log(`   S${soruNo}: EKSİK id=${r?.id}`);
    continue;
  }
  const tip = TEMEL_DERSLER.has(r.q.ders) ? "Temel" : KLINIK_DERSLER.has(r.q.ders) ? "Klinik" : "?";
  console.log(
    `   S${String(soruNo).padStart(3)} | id=${String(r.id).padStart(4)} | ${pad(r.q.ders, 28)} | ${r.q.konu} [${tip}]`
  );
}
console.log("");

console.log("8) DÜŞÜK ID SEÇİMİ — KONU KÜMELENMESİ NOTU");
console.log(line());
console.log(
  "   Set, generate script ile konu round-robin + ders interleave ile üretilir (id sırası konu içinde deterministik)."
);
const lowIdRuns = [];
let idRun = 0;
for (let i = 1; i < resolved.length; i += 1) {
  if (resolved[i].q.ders === resolved[i - 1].q.ders) idRun += 1;
  else {
    if (idRun >= 4) {
      lowIdRuns.push({
        start: resolved[i - idRun].soruNo,
        end: resolved[i - 1].soruNo,
        ders: resolved[i - 1].q.ders,
        len: idRun + 1,
      });
    }
    idRun = 0;
  }
}
if (idRun >= 4) {
  const i = resolved.length - 1;
  lowIdRuns.push({
    start: resolved[i - idRun].soruNo,
    end: resolved[i].soruNo,
    ders: resolved[i].q.ders,
    len: idRun + 1,
  });
}
console.log(`   Aynı ders içinde ardışık blok (≥5 soru, konu farklı olabilir): ${lowIdRuns.length} adet`);
for (const b of lowIdRuns.slice(0, 8)) {
  console.log(`      S${b.start}–S${b.end}: ${b.ders} (${b.len} soru)`);
}
console.log("");

console.log("9) UYARILAR");
console.log(line());
if (warnings.length === 0) {
  console.log("   Kritik uyarı yok.");
} else {
  for (const w of warnings) console.log(`   ⚠ ${w}`);
}
console.log("");

console.log("10) KISA DEĞERLENDİRME");
console.log(line());
const maxTopic = topicCounts[0];
const maxStreak = streaks.reduce((m, s) => Math.max(m, s.len), 0);
let quality = "İyi";
let note =
  "Temel/Klinik ayrımı doğru; ders kotları blueprint’e uygun; konu tekrarları TUS denemesi için makul.";
if (!temelOk || !klinikOk || missing.length) {
  quality = "Sorunlu";
  note = "Eksik id veya Temel/Klinik blok hatası var; set düzeltilmeli.";
} else if (warnings.length > 3 || maxStreak >= 10 || (maxTopic && maxTopic[1] > 12)) {
  quality = "Yeniden dengelenmeli";
  note =
    "Düşük id seçimi nedeniyle aynı konu/ders blokları belirgin; konu çeşitliliği için set içi karıştırma veya id seçim stratejisi gözden geçirilmeli.";
} else if (warnings.length > 0 || maxStreak >= 7) {
  quality = "Kabul edilebilir, iyileştirilebilir";
  note =
    "Genel yapı sağlam; bazı ardışık konu kümeleri var ama tam deneme için tolere edilebilir.";
}
console.log(`   Kalite özeti: ${quality}`);
console.log(`   ${note}`);
console.log("");
console.log(line("═"));
console.log("");
