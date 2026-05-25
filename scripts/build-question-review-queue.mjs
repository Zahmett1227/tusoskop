import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIT_JSON = join(ROOT, "reports/question-bank-quality-audit.json");
const QUEUE_MD = join(ROOT, "reports/question-bank-review-queue.md");
const QUEUE_JSON = join(ROOT, "reports/question-bank-review-queue.json");
const MANIFEST_PATH = join(ROOT, "src/data/questionChunks/_manifest.json");

const DEFAULT_LIMIT = 50;
const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

function parseLimit() {
  const arg = process.argv.find((item) => item.startsWith("--limit="));
  if (!arg) return DEFAULT_LIMIT;
  const value = Number(arg.slice("--limit=".length));
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_LIMIT;
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "/")
    .replace(/\r?\n/g, " ")
    .trim();
}

function excerpt(value, limit = 180) {
  const text = escapeCell(value).replace(/\s+/g, " ");
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

async function loadAllQuestions() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const byId = new Map();
  for (const slug of Object.keys(manifest.subjectBySlug || {})) {
    const mod = await import(
      new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href
    );
    const questions = Array.isArray(mod.QUESTIONS) ? mod.QUESTIONS : [];
    for (const question of questions) {
      byId.set(Number(question.id), { ...question, _slug: slug });
    }
  }
  return byId;
}

function severityScore(severity) {
  if (severity === "critical") return 100;
  if (severity === "medium") return 40;
  if (severity === "low") return 10;
  return 0;
}

function buildRows(audit, questionById, limit) {
  const grouped = new Map();
  for (const finding of audit.findings || []) {
    if (finding.id == null) continue;
    const id = Number(finding.id);
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        score: 0,
        severities: new Set(),
        types: new Set(),
        actions: new Set(),
        findings: [],
      });
    }
    const row = grouped.get(id);
    row.score += severityScore(finding.severity) + (finding.manual ? 15 : 0);
    if (String(finding.type || "").includes("duplicate")) row.score += 30;
    if (String(finding.type || "").includes("correct")) row.score += 30;
    row.severities.add(finding.severity);
    row.types.add(finding.type);
    row.actions.add(finding.action);
    row.findings.push(finding);
  }

  const preferredIds = audit.summary?.manualReviewIdsTop50 || [];
  const preferred = preferredIds
    .map((id) => grouped.get(Number(id)))
    .filter(Boolean);
  const remaining = [...grouped.values()]
    .filter((row) => !preferredIds.includes(row.id))
    .sort((a, b) => b.score - a.score || a.id - b.id);

  return [...preferred, ...remaining].slice(0, limit).map((row, index) => {
    const question = questionById.get(row.id);
    const correctIndex = Number(question?.correct);
    const correctLabel = Number.isInteger(correctIndex)
      ? `${OPTION_LETTERS[correctIndex] || "?"}: ${question?.options?.[correctIndex] ?? ""}`
      : "";
    return {
      rank: index + 1,
      id: row.id,
      score: row.score,
      ders: question?.ders ?? row.findings[0]?.ders ?? "",
      konu: question?.konu ?? row.findings[0]?.konu ?? "",
      slug: question?._slug ?? "",
      severities: [...row.severities].filter(Boolean),
      problemTypes: [...row.types].filter(Boolean),
      actions: [...row.actions].filter(Boolean),
      questionExcerpt: excerpt(question?.q),
      correct: excerpt(correctLabel, 140),
      status: "open",
      reviewer: "",
      decision: "",
      notes: "",
    };
  });
}

function renderMarkdown(audit, rows) {
  const generatedAt = new Date().toISOString();
  let md = `# Tusoskop Soru Bankası Manuel Kontrol Kuyruğu

_Oluşturulma: ${generatedAt}_  
_Kaynak audit: ${audit.generatedAt || "bilinmiyor"}_  
_Amaç: Otomatik kalite bulgularını doktor/uzman kontrolüne çevirmek. Bu dosya soru bankasını değiştirmez._

## Kullanım

1. \`npm run quality:questions\` ile validate + audit + queue üret.
2. Aşağıdaki satırlarda \`status\`, \`reviewer\`, \`decision\`, \`notes\` alanlarını çalışma notu olarak kullan.
3. Düzeltme yapılırsa ilgili soru dosyasını güncelle, sonra \`npm run quality:questions\` komutunu tekrar çalıştır.
4. Doktor onayı gerektiren satırlarda \`decision=needs_physician\`; yanlış pozitiflerde \`decision=false_positive\` yaz.

## Durum Sözlüğü

| Alan | Değerler |
|------|----------|
| status | open, in_review, fixed, deferred |
| decision | fix, false_positive, needs_physician, accepted_as_is |

## Özet

| Metrik | Değer |
|--------|------:|
| Toplam soru | ${audit.totalQuestions ?? "—"} |
| Kritik bulgu | ${audit.summary?.criticalCount ?? "—"} |
| Orta bulgu | ${audit.summary?.mediumCount ?? "—"} |
| Düşük bulgu | ${audit.summary?.lowCount ?? "—"} |
| Kuyruk satırı | ${rows.length} |

## Kontrol Kuyruğu

| sıra | id | ders | konu | skor | önem | problem | önerilen aksiyon | doğru | soru özeti | status | reviewer | decision | notes |
|-----:|---:|------|------|-----:|------|---------|------------------|-------|------------|--------|----------|----------|-------|
`;

  for (const row of rows) {
    md += `| ${row.rank} | ${row.id} | ${escapeCell(row.ders)} | ${escapeCell(row.konu)} | ${row.score} | ${escapeCell(row.severities.join(", "))} | ${escapeCell(row.problemTypes.join(", "))} | ${escapeCell(row.actions.join("; "))} | ${escapeCell(row.correct)} | ${escapeCell(row.questionExcerpt)} | ${row.status} | ${row.reviewer} | ${row.decision} | ${row.notes} |\n`;
  }

  md += `
## İş Akışı Kapıları

- **Bloklayıcı kapı:** \`npm run validate:questions\` hata verirse soru bankası merge edilmez.
- **Kalite kapısı:** Kritik bulgu varsa önce kritikler kapanır; orta bulgular manuel kontrol kuyruğuna girer.
- **Tıbbi doğruluk kapısı:** Doğru cevap, açıklama veya terminoloji şüphesi doktor/uzman onayı almadan otomatik düzeltilmez.
- **Yanlış pozitif kapısı:** Audit yanılmışsa not düşülür; gerekirse audit heuristiği ayrı PR ile iyileştirilir.
`;
  return md;
}

const limit = parseLimit();
const audit = JSON.parse(await readFile(AUDIT_JSON, "utf8"));
const questionById = await loadAllQuestions();
const rows = buildRows(audit, questionById, limit);

await mkdir(dirname(QUEUE_MD), { recursive: true });
await writeFile(QUEUE_MD, renderMarkdown(audit, rows), "utf8");
await writeFile(
  QUEUE_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceAuditGeneratedAt: audit.generatedAt,
      totalQuestions: audit.totalQuestions,
      limit,
      rows,
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Review queue written: ${QUEUE_MD}`);
console.log(`Review queue JSON written: ${QUEUE_JSON}`);
console.log(`Rows: ${rows.length}`);
