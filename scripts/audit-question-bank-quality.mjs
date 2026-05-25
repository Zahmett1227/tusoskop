/**
 * Tusoskop soru bankası kalite denetimi — yalnızca rapor üretir, soru içeriğini değiştirmez.
 * Çalıştırma: node scripts/audit-question-bank-quality.mjs
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "src/data/questionChunks/_manifest.json");
const REPORT_MD = join(ROOT, "reports/question-bank-quality-audit.md");
const REPORT_JSON = join(ROOT, "reports/question-bank-quality-audit.json");

const VALID_SUBJECTS = new Set([
  "Fizyoloji",
  "Patoloji",
  "Farmakoloji",
  "Mikrobiyoloji",
  "Anatomi",
  "Biyokimya",
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
]);

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];
const BOGUS_PATTERNS = [
  /\bundefined\b/i,
  /\bnull\b/i,
  /\bNaN\b/,
  /\[object Object\]/i,
  /&lt;|&gt;|&amp;|&#\d+;/,
];
const RISKY_OPTION_PATTERNS = [
  /\bhepsi\b/i,
  /\bhiçbiri\b/i,
  /\bhiç biri\b/i,
  /\btümü\b/i,
  /\bnone of the above\b/i,
  /\ball of the above\b/i,
];
const EXP_LETTER_PATTERNS = [
  /doğru cevap\s*[:\-]?\s*([A-E])/gi,
  /cevap\s*[:\-]?\s*([A-E])\b/gi,
  /şıkk?[ıi]\s*([A-E])\b/gi,
];

const TOPIC_ALIAS_HINTS = [
  ["geriartri", "geriatri"],
  ["immun", "immün"],
  ["kemoterapotik", "kemoterapötik"],
  ["appendix", "apendiks"],
  ["histofizyoloji", "histo fizyoloji"],
  ["pediatri", "çocuk sağlığı"],
];

/** @type {{ severity: 'critical'|'medium'|'low', type: string, id?: number, ders?: string, konu?: string, detail: string, action: string, manual: boolean }[]} */
const findings = [];

function addFinding(severity, type, question, detail, action, manual = false) {
  findings.push({
    severity,
    type,
    id: question?.id,
    ders: question?.ders,
    konu: question?.konu,
    detail,
    action,
    manual,
  });
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[«»""'']/g, '"')
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function stripDiacritics(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function wordSet(s) {
  return new Set(
    normalizeText(s)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2)
  );
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function hasUnbalancedBrackets(s) {
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const stack = [];
  for (const ch of s) {
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (Object.values(pairs).includes(ch)) {
      if (stack.pop() !== ch) return true;
    }
  }
  return stack.length > 0;
}

function levenshteinRatio(a, b) {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

async function loadAllQuestions() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const questions = [];
  for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug || {})) {
    const mod = await import(
      new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href
    );
    const chunk = Array.isArray(mod.QUESTIONS) ? mod.QUESTIONS : [];
    for (const q of chunk) {
      questions.push({ ...q, _slug: slug, _expectedDers: subjectName });
    }
  }
  return { manifest, questions };
}

function auditStructural(q) {
  const ctx = `id ${q.id}`;
  if (q.id == null || !Number.isInteger(Number(q.id))) {
    addFinding("critical", "missing_or_invalid_id", q, "id eksik veya sayı değil", "id düzelt", false);
  }
  if (!isNonEmptyString(q.ders)) {
    addFinding("critical", "missing_ders", q, "ders boş", "ders ata", false);
  } else if (!VALID_SUBJECTS.has(q.ders)) {
    addFinding("critical", "invalid_ders_name", q, `Geçersiz ders: "${q.ders}"`, "ders adını standartlaştır", false);
  } else if (q.ders !== q._expectedDers) {
    addFinding("critical", "ders_manifest_mismatch", q, `Manifest "${q._expectedDers}" ile uyuşmuyor`, "ders eşleştir", false);
  }
  if (!isNonEmptyString(q.konu)) {
    addFinding("critical", "missing_konu", q, "konu boş", "konu ata", false);
  }
  if (!isNonEmptyString(q.q)) {
    addFinding("critical", "empty_question_text", q, "Soru metni (q) boş", "soru metni yaz", false);
  } else if (q.q.trim().length < 15) {
    addFinding("low", "very_short_question", q, `Kısa soru metni (${q.q.trim().length} karakter)`, "metni gözden geçir", true);
  }
  if (!isNonEmptyString(q.exp)) {
    addFinding("critical", "empty_explanation", q, "Açıklama (exp) boş", "açıklama yaz", false);
  } else if (q.exp.trim().length < 20) {
    addFinding("medium", "very_short_explanation", q, `Kısa açıklama (${q.exp.trim().length} karakter)`, "açıklamayı genişlet", true);
  }
  if (q.diff != null) {
    const d = Number(q.diff);
    if (!Number.isFinite(d) || d < 1 || d > 5) {
      addFinding("medium", "invalid_diff", q, `diff=${q.diff} (1-5 beklenir)`, "diff değerini gözden geçir", true);
    }
  }
  if (!Array.isArray(q.options)) {
    addFinding("critical", "options_not_array", q, "options dizi değil", "options düzelt", false);
    return;
  }
  if (q.options.length !== 5) {
    addFinding(
      q.options.length < 2 ? "critical" : "medium",
      "options_count_not_five",
      q,
      `${q.options.length} seçenek (5 beklenir)`,
      "seçenek sayısını düzelt",
      false
    );
  }
  const seenOpt = new Map();
  q.options.forEach((opt, i) => {
    if (!isNonEmptyString(opt)) {
      addFinding("critical", "empty_option", q, `options[${i}] boş`, "seçeneği doldur", false);
    } else if (opt.trim().length < 2) {
      addFinding("low", "very_short_option", q, `options[${i}] çok kısa: "${opt}"`, "seçeneği gözden geçir", true);
    } else if (opt.length > 220) {
      addFinding("low", "very_long_option", q, `options[${i}] çok uzun (${opt.length} karakter)`, "kısaltmayı değerlendir", true);
    }
    const norm = normalizeText(opt);
    if (seenOpt.has(norm)) {
      addFinding("medium", "duplicate_option_in_question", q, `Tekrarlayan seçenek: "${opt}"`, "seçenekleri ayır", true);
    } else seenOpt.set(norm, i);
  });
  if (!Number.isInteger(q.correct)) {
    addFinding("critical", "invalid_correct_index", q, `correct=${q.correct}`, "correct index düzelt", false);
  } else if (q.correct < 0 || q.correct >= q.options.length) {
    addFinding("critical", "correct_out_of_range", q, `correct=${q.correct}, options=${q.options.length}`, "correct index düzelt", false);
  }
}

function auditTextQuality(q) {
  for (const pat of BOGUS_PATTERNS) {
    for (const field of ["q", "exp", ...q.options]) {
      if (typeof field === "string" && pat.test(field)) {
        addFinding("medium", "bogus_token_in_text", q, `Şüpheli ifade (${pat}): ${field.slice(0, 60)}…`, "metni düzelt", true);
        break;
      }
    }
  }
  if (isNonEmptyString(q.q)) {
    if (hasUnbalancedBrackets(q.q)) {
      addFinding("low", "unbalanced_brackets_q", q, "Parantez/tırnak dengesiz olabilir", "noktalama kontrol", true);
    }
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(q.q)) {
      addFinding("medium", "control_chars_in_q", q, "Kontrol karakteri içeriyor", "temizle", true);
    }
  }
  q.options.forEach((opt, i) => {
    if (!isNonEmptyString(opt)) return;
    for (const pat of RISKY_OPTION_PATTERNS) {
      if (pat.test(opt)) {
        addFinding("medium", "risky_all_none_option", q, `options[${i}]: "${opt}"`, "TUS uygunluğunu kontrol et", true);
        break;
      }
    }
    if (/\bform\b/i.test(opt) && opt.length < 25) {
      addFinding("low", "suspicious_option_phrase", q, `options[${i}]: "${opt}"`, "terminoloji kontrol", true);
    }
  });
}

function auditExpHeuristics(q) {
  if (!Array.isArray(q.options) || !Number.isInteger(q.correct)) return;
  const correctText = q.options[q.correct];
  if (!isNonEmptyString(correctText) || !isNonEmptyString(q.exp)) return;

  const expNorm = normalizeText(q.exp);
  const correctNorm = normalizeText(correctText);
  if (correctNorm.length >= 4 && !expNorm.includes(correctNorm)) {
    const correctWords = [...wordSet(correctText)].filter((w) => w.length > 4);
    const mentioned = correctWords.filter((w) => expNorm.includes(w));
    if (correctWords.length >= 2 && mentioned.length < Math.ceil(correctWords.length * 0.3)) {
      addFinding(
        "medium",
        "exp_missing_correct_option_text",
        q,
        "Açıklamada doğru şık metni zayıf geçiyor",
        "açıklama–cevap uyumunu kontrol et",
        true
      );
    }
  }

  for (const re of EXP_LETTER_PATTERNS) {
    let m;
    const reCopy = new RegExp(re.source, re.flags);
    while ((m = reCopy.exec(q.exp)) !== null) {
      const letter = m[1]?.toUpperCase();
      const idx = OPTION_LETTERS.indexOf(letter);
      if (idx >= 0 && idx !== q.correct) {
        addFinding(
          "medium",
          "exp_letter_mismatch",
          q,
          `Açıklamada "${letter}" geçiyor; correct index ${q.correct} (${OPTION_LETTERS[q.correct]})`,
          "açıklama veya correct kontrol",
          true
        );
        break;
      }
    }
  }

  let strongestOther = -1;
  let strongestScore = 0;
  q.options.forEach((opt, i) => {
    if (i === q.correct || !isNonEmptyString(opt)) return;
    const score = jaccard(wordSet(q.exp), wordSet(opt));
    if (score > strongestScore) {
      strongestScore = score;
      strongestOther = i;
    }
  });
  const correctScore = jaccard(wordSet(q.exp), wordSet(correctText));
  if (strongestOther >= 0 && strongestScore > correctScore + 0.15 && strongestScore >= 0.45) {
    addFinding(
      "medium",
      "exp_favors_other_option",
      q,
      `Açıklama ${OPTION_LETTERS[strongestOther]} şıkkına daha yakın görünüyor (heuristik)`,
      "manuel tıbbi kontrol",
      true
    );
  }
}

function auditTopicNames(questions) {
  const byDers = new Map();
  for (const q of questions) {
    if (!q.ders || !q.konu) continue;
    if (!byDers.has(q.ders)) byDers.set(q.ders, new Map());
    const m = byDers.get(q.ders);
    m.set(q.konu, (m.get(q.konu) || 0) + 1);
  }

  for (const [ders, konuMap] of byDers) {
    const names = [...konuMap.keys()];
    for (const name of names) {
      if (name !== name.trim()) {
        addFinding("low", "konu_extra_whitespace", { id: null, ders, konu: name }, `"${name}"`, "boşlukları düzelt", false);
      }
      if (/\s{2,}/.test(name)) {
        addFinding("low", "konu_double_space", { id: null, ders, konu: name }, `"${name}"`, "boşlukları düzelt", false);
      }
      if (name.length > 70) {
        addFinding("medium", "konu_very_long", { id: null, ders, konu: name }, `${name.length} karakter`, "konu adını daralt", true);
      }
      if (name.length <= 2) {
        addFinding("medium", "konu_very_short", { id: null, ders, konu: name }, `"${name}"`, "konu adını netleştir", true);
      }
      const ascii = stripDiacritics(name).toLowerCase();
      const hasTurkish = /[çğıöşüÇĞİÖŞÜ]/.test(name);
      const looksAsciiOnly = !hasTurkish && /[a-z]/i.test(name);
      if (looksAsciiOnly && /(dogum|hastalik|cerrahi|immun|kemoterapi|appendix)/i.test(ascii)) {
        addFinding("low", "konu_ascii_turkish_hint", { id: null, ders, konu: name }, "Türkçe karakter eksik olabilir", "yazım kontrol", true);
      }
    }

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i];
        const b = names[j];
        const na = normalizeText(a);
        const nb = normalizeText(b);
        if (na === nb && a !== b) {
          addFinding(
            "medium",
            "konu_case_or_diacritic_variant",
            { id: null, ders, konu: a },
            `"${a}" vs "${b}"`,
            "tek konu adına birleştir",
            true
          );
        } else {
          const ratio = levenshteinRatio(na, nb);
          if (ratio >= 0.88 && na.length > 5 && a !== b) {
            addFinding(
              "medium",
              "konu_near_duplicate_name",
              { id: null, ders, konu: a },
              `"${a}" ~ "${b}" (${(ratio * 100).toFixed(0)}%)`,
              "konu adlarını birleştir",
              true
            );
          }
        }
      }
    }
  }

  const aliasSeen = new Set();
  for (const [hintA, hintB] of TOPIC_ALIAS_HINTS) {
    for (const q of questions) {
      const kn = normalizeText(q.konu);
      const key = `${q.ders}::${kn}::${hintA}`;
      if (aliasSeen.has(key)) continue;
      if (kn.includes(hintA) && !kn.includes(hintB)) {
        aliasSeen.add(key);
        addFinding(
          "low",
          "konu_alias_hint",
          q,
          `Konu "${q.konu}" — "${hintB}" varyantı da var mı?`,
          "standardizasyon",
          true
        );
      }
    }
  }
}

function auditDuplicates(questions) {
  const byNormQ = new Map();
  const idSet = new Map();

  for (const q of questions) {
    if (Number.isInteger(q.id)) {
      if (idSet.has(q.id)) {
        addFinding("critical", "duplicate_id", q, `id ${q.id} tekrar`, "id benzersiz yap", false);
      } else idSet.set(q.id, q);
    }
    const nq = normalizeText(q.q);
    if (!nq) continue;
    if (!byNormQ.has(nq)) byNormQ.set(nq, []);
    byNormQ.get(nq).push(q);
  }

  for (const [, group] of byNormQ) {
    if (group.length < 2) continue;
    const corrects = new Set(group.map((g) => g.correct));
    if (corrects.size > 1) {
      for (const q of group) {
        addFinding(
          "critical",
          "same_question_different_correct",
          q,
          `Aynı soru kökü, farklı correct: ids ${group.map((g) => g.id).join(", ")}`,
          "acil manuel kontrol",
          true
        );
      }
    } else {
      for (const q of group.slice(1)) {
        addFinding(
          "medium",
          "exact_duplicate_question_text",
          q,
          `Tekrar id'ler: ${group.map((g) => g.id).join(", ")}`,
          "tekrarları birleştir",
          true
        );
      }
    }
  }

  const byKonu = new Map();
  for (const q of questions) {
    const key = `${q.ders}|||${q.konu}`;
    if (!byKonu.has(key)) byKonu.set(key, []);
    byKonu.get(key).push(q);
  }

  for (const [, group] of byKonu) {
    if (group.length < 2 || group.length > 120) continue;
    for (let i = 0; i < group.length; i++) {
      const ni = normalizeText(group[i].q);
      if (ni.length < 25) continue;
      const wi = wordSet(group[i].q);
      for (let j = i + 1; j < group.length; j++) {
        const nj = normalizeText(group[j].q);
        if (Math.abs(ni.length - nj.length) > Math.max(40, ni.length * 0.35)) continue;
        const ratio = levenshteinRatio(ni, nj);
        const jac = jaccard(wi, wordSet(group[j].q));
        if (ratio >= 0.92 || jac >= 0.94) {
          if (ni === nj) continue;
          addFinding(
            "medium",
            "near_duplicate_question",
            group[j],
            `id ${group[i].id} ile çok benzer (${(Math.max(ratio, jac) * 100).toFixed(0)}%)`,
            "tekrar veya varyant kontrol",
            true
          );
        }
      }
    }
  }
}

function buildStats(questions, manifest) {
  const byDers = {};
  const byKonu = {};
  const byDiff = {};
  for (const q of questions) {
    byDers[q.ders] = (byDers[q.ders] || 0) + 1;
    const kk = `${q.ders} — ${q.konu}`;
    byKonu[kk] = (byKonu[kk] || 0) + 1;
    const d = q.diff != null ? String(q.diff) : "yok";
    byDiff[d] = (byDiff[d] || 0) + 1;
  }
  const konuSorted = Object.entries(byKonu).sort((a, b) => b[1] - a[1]);
  const konuFew = konuSorted.filter(([, c]) => c <= 2);
  return {
    total: questions.length,
    byDers,
    byDiff,
    manifestCounts: manifest.subjectCounts,
    top20Konu: konuSorted.slice(0, 20),
    fewKonu: konuSorted.filter(([, c]) => c <= 2).slice(0, 30),
    uniqueKonuCount: konuSorted.length,
    diffByDers: buildDiffByDers(questions),
  };
}

function buildDiffByDers(questions) {
  const m = {};
  for (const q of questions) {
    if (!m[q.ders]) m[q.ders] = {};
    const d = q.diff != null ? String(q.diff) : "?";
    m[q.ders][d] = (m[q.ders][d] || 0) + 1;
  }
  return m;
}

function tableRows(items, limit = 50) {
  if (!items.length) return "_Bulgu yok._\n";
  const slice = items.slice(0, limit);
  let s =
    "| id | ders | konu | problem | açıklama | aksiyon | manuel |\n|---|---|---|---|---|---|---|\n";
  for (const f of slice) {
    s += `| ${f.id ?? "—"} | ${f.ders ?? "—"} | ${(f.konu ?? "—").replace(/\|/g, "/")} | ${f.type} | ${f.detail.replace(/\|/g, "/").slice(0, 80)} | ${f.action} | ${f.manual ? "evet" : "hayır"} |\n`;
  }
  if (items.length > limit) {
    s += `\n_…ve ${items.length - limit} kayıt daha (tam liste JSON dosyasında)._ \n`;
  }
  return s;
}

function topicStandardizationTable(questions) {
  const rows = findings.filter((f) => f.type.startsWith("konu_") && !f.id);
  const unique = new Map();
  for (const r of rows) {
    const k = `${r.ders}::${r.konu}::${r.type}`;
    if (!unique.has(k)) unique.set(k, r);
  }
  return tableRows([...unique.values()], 80);
}

function manualPriority50() {
  const scored = [];
  const seen = new Set();
  for (const f of findings) {
    if (f.id == null || seen.has(f.id)) continue;
    let score = 0;
    if (f.severity === "critical") score += 100;
    if (f.severity === "medium") score += 40;
    if (f.severity === "low") score += 10;
    if (f.manual) score += 15;
    if (f.type.includes("duplicate") || f.type.includes("correct")) score += 30;
    scored.push({ id: f.id, score, types: [f.type] });
    seen.add(f.id);
  }
  for (const f of findings) {
    if (f.id == null) continue;
    const row = scored.find((s) => s.id === f.id);
    if (row && !row.types.includes(f.type)) row.types.push(f.type);
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

function countByType(list) {
  const c = {};
  for (const f of list) {
    c[f.type] = (c[f.type] || 0) + 1;
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

function problematicSubjects(findingsList) {
  const ders = {};
  const konu = {};
  for (const f of findingsList) {
    if (f.ders) ders[f.ders] = (ders[f.ders] || 0) + 1;
    if (f.ders && f.konu) {
      const k = `${f.ders} — ${f.konu}`;
      konu[k] = (konu[k] || 0) + 1;
    }
  }
  return {
    ders: Object.entries(ders).sort((a, b) => b[1] - a[1]).slice(0, 10),
    konu: Object.entries(konu).sort((a, b) => b[1] - a[1]).slice(0, 10),
  };
}

async function main() {
  console.log("Soru bankası yükleniyor…");
  const { manifest, questions } = await loadAllQuestions();
  console.log(`${questions.length} soru yüklendi.`);

  for (const q of questions) {
    auditStructural(q);
    auditTextQuality(q);
    auditExpHeuristics(q);
  }
  auditTopicNames(questions);
  auditDuplicates(questions);

  const stats = buildStats(questions, manifest);
  const critical = findings.filter((f) => f.severity === "critical");
  const medium = findings.filter((f) => f.severity === "medium");
  const low = findings.filter((f) => f.severity === "low");
  const topTypes = countByType(findings);
  const prob = problematicSubjects(findings);
  const manual50 = manualPriority50();
  const manual20 = manual50.slice(0, 20).map((x) => x.id);

  const diffSkew = Object.entries(stats.byDiff)
    .map(([k, v]) => ({ k, v, pct: ((v / stats.total) * 100).toFixed(1) }))
    .sort((a, b) => b.v - a.v);

  let md = `# Tusoskop Soru Bankası Kalite Denetimi

_Oluşturulma: ${new Date().toISOString()}_  
_Bu rapor yapısal ve heuristik sinyaller içerir; tıbbi doğruluk iddiası taşımaz. Kesin olmayan bulgular "manuel kontrol" olarak işaretlenmiştir._  
**Soru bankası dosyalarında otomatik düzeltme yapılmamıştır.**

## Genel Özet

| Metrik | Değer |
|--------|------:|
| Toplam soru | ${stats.total} |
| Ders sayısı | ${Object.keys(stats.byDers).length} |
| Benzersiz konu (ders+konu) | ${stats.uniqueKonuCount} |
| Kritik bulgu (kayıt) | ${critical.length} |
| Orta bulgu (kayıt) | ${medium.length} |
| Düşük bulgu (kayıt) | ${low.length} |

### Ders bazlı soru sayısı

| Ders | Soru | Manifest |
|------|-----:|---------:|
`;

  for (const [ders, count] of Object.entries(stats.byDers).sort((a, b) => b[1] - a[1])) {
    const exp = stats.manifestCounts?.[ders] ?? "—";
    md += `| ${ders} | ${count} | ${exp} |\n`;
  }

  md += `\n### diff dağılımı (genel)\n\n| diff | Adet | % |\n|------|-----:|--:|\n`;
  for (const row of diffSkew) {
    md += `| ${row.k} | ${row.v} | ${row.pct}% |\n`;
  }

  const diff4Pct = stats.byDiff["4"] ? (stats.byDiff["4"] / stats.total) * 100 : 0;
  if (diff4Pct > 55) {
    md += `\n> **Uyarı:** Soruların ~${diff4Pct.toFixed(1)}% diff=4 değerinde. diff alanı otomatik güvenilir zorluk göstergesi olmayabilir; bu turda diff değiştirilmedi.\n`;
  }

  md += `\n### En çok soru olan 20 konu\n\n| Konu | Adet |\n|------|-----:|\n`;
  for (const [k, v] of stats.top20Konu) {
    md += `| ${k.replace(/\|/g, "/")} | ${v} |\n`;
  }

  md += `\n### Çok az soru olan konular (≤2, ilk 30)\n\n| Konu | Adet |\n|------|-----:|\n`;
  for (const [k, v] of stats.fewKonu) {
    md += `| ${k.replace(/\|/g, "/")} | ${v} |\n`;
  }

  md += `\n### Ders bazında diff dağılımı\n\n`;
  for (const [ders, dist] of Object.entries(stats.diffByDers).sort((a, b) => stats.byDers[b[0]] - stats.byDers[a[0]])) {
    md += `**${ders}:** ${Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([d, n]) => `${d}=${n}`)
      .join(", ")}\n\n`;
  }

  md += `\n## Kritik Bulgular\n\n${tableRows(critical, 50)}\n`;
  md += `\n## Orta Seviye Bulgular\n\n${tableRows(medium, 50)}\n`;
  md += `\n## Düşük Seviye Bulgular\n\n${tableRows(low, 50)}\n`;
  md += `\n## Konu Adı Standardizasyon Önerileri\n\n${topicStandardizationTable(questions)}\n`;

  md += `\n## Manuel Kontrol İçin Öncelikli 50 Soru\n\n| Sıra | id | öncelik skoru | problem tipleri |\n|-----:|---:|---:|---|\n`;
  manual50.forEach((row, i) => {
    md += `| ${i + 1} | ${row.id} | ${row.score} | ${row.types.join(", ")} |\n`;
  });

  md += `\n## En sık görülen problem tipleri (ilk 15)\n\n| Tip | Adet |\n|-----|-----:|\n`;
  for (const [t, n] of topTypes.slice(0, 15)) {
    md += `| ${t} | ${n} |\n`;
  }

  md += `\n## En problemli dersler / konular (bulgu sayısına göre)\n\n**Ders:**\n`;
  for (const [d, n] of prob.ders) {
    md += `- ${d}: ${n} bulgu kaydı\n`;
  }
  md += `\n**Konu:**\n`;
  for (const [k, n] of prob.konu) {
    md += `- ${k}: ${n} bulgu kaydı\n`;
  }

  md += `\n## Sonuç ve İlk Düzeltme Önerisi

1. **Önce kritik:** duplicate id, correct aralığı, boş q/exp, aynı soru kökünde farklı correct, geçersiz ders adı.
2. **Sonra orta:** konu adı birleştirme, near-duplicate sorular, açıklama–şık uyumsuzluğu heuristikleri, 5 dışı seçenek sayısı.
3. **Son olarak düşük:** yazım, boşluk, kısa/uzun metin stil tutarlılığı.

Tam bulgu listesi: \`reports/question-bank-quality-audit.json\`
`;

  const jsonOut = {
    generatedAt: new Date().toISOString(),
    totalQuestions: stats.total,
    summary: {
      criticalCount: critical.length,
      mediumCount: medium.length,
      lowCount: low.length,
      uniqueCriticalIds: [...new Set(critical.map((f) => f.id).filter(Boolean))].length,
      topProblemTypes: topTypes.slice(0, 20),
      problematicDers: prob.ders,
      problematicKonu: prob.konu,
      manualReviewIdsTop20: manual20,
      manualReviewIdsTop50: manual50.map((x) => x.id),
    },
    stats,
    findings,
  };

  await mkdir(dirname(REPORT_MD), { recursive: true });
  await writeFile(REPORT_MD, md, "utf8");
  await writeFile(REPORT_JSON, JSON.stringify(jsonOut, null, 2), "utf8");

  console.log(`Rapor yazıldı: ${REPORT_MD}`);
  console.log(`JSON yazıldı: ${REPORT_JSON}`);
  console.log(`Özet: kritik=${critical.length}, orta=${medium.length}, düşük=${low.length}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
