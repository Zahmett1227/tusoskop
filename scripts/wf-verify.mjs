export const meta = {
  name: 'tus-verify',
  description: 'Triyajda isaretlenen sorunlarin adversarial derin dogrulamasi (Opus)',
  phases: [{ title: 'Dogrulama', detail: 'Her verify-input dosyasi bir Opus agent tarafindan skeptik incelenir' }],
};

// args: { dir: "/abs/verify_in", count: N }
const A = typeof args === 'string' ? JSON.parse(args) : (args || {});
const dir = A.dir;
const count = A.count || 0;

const files = [];
for (let i = 0; i < count; i++) files.push(`${dir}/ver-${String(i).padStart(3, '0')}.json`);

const SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          category: { type: 'string' },
          verdict: { type: 'string', enum: ['confirmed', 'rejected', 'uncertain'] },
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          finalIssue: { type: 'string', description: 'Turkce: dogrulanan/duzeltilen sorun tanimi' },
          finalFix: { type: 'string', description: 'Turkce: kesin cozum onerisi (wrong_answer ise dogru sik harfi)' },
        },
        required: ['id', 'category', 'verdict', 'severity', 'confidence', 'finalIssue', 'finalFix'],
      },
    },
  },
  required: ['verdicts'],
};

const prompt = (p) => `Sen TUS (Tipta Uzmanlik Sinavi) icin kidemli bir tip profesoru ve sinav editorusun. Gorevi COK TITIZ ve SKEPTIK yapiyorsun.

Read araciyla su dosyayi oku: ${p}
Bu dosya, onceki bir triyaj turunda "sorunlu olabilir" diye isaretlenmis bulgularin JSON dizisidir. Her bulgu su alanlari icerir: id, category, severity, issue (iddia edilen sorun), proposedFix (onerilen cozum), batch (o sorunun TAM halinin bulundugu dosya yolu).

Her bulgu icin:
1. Read araciyla "batch" dosyasini oku ve id'si eslesen sorunun TAM halini bul (q, options, correct, exp).
2. Soruyu SIFIRDAN, bagimsiz olarak kendin coz. Dogru cevabi kendi tibbi bilginle belirle.
3. Triyajin iddiasini ADVERSARIAL degerlendir: Iddia GERCEKTEN dogru mu, yoksa triyaj yanilmis mi?
   - verdict="confirmed": Sorun gercek. (finalIssue'da net acikla, finalFix'te kesin cozum ver. wrong_answer ise dogru sikkin harfini A-E olarak belirt.)
   - verdict="rejected": Triyaj yanilmis, soru aslinda dogru/sorunsuz. (finalIssue'da neden yanlis alarm oldugunu kisaca yaz.)
   - verdict="uncertain": Kaynaga gore degisebilen, tartismali veya emin olunamayan durum. (finalIssue'da belirsizligi acikla.)
4. severity'yi kendi degerlendirmene gore ata (critical=cevap anahtari yanlis/ciddi tibbi hata; major=onemli ama cevabi degistirmeyen hata; minor=dil/stil/kucuk).
5. confidence: kendi kararina ne kadar eminsin (high/medium/low).

KURALLAR:
- Emin olmadan "confirmed" deme; ama gercek hatalari da "rejected" ile ortme. Dengeli ve dogru ol.
- Tibbi iddialarini guncel, yaygin kabul goren Turkiye TUS mufredati bilgisine dayandir.
- Tum metinler TURKCE.
- Dosyadaki HER bulgu icin bir verdict dondur (id ile eslesecek sekilde).

Ciktiyi StructuredOutput semasina gore ver: { verdicts: [...] }.`;

const results = await parallel(
  files.map((p) => () =>
    agent(prompt(p), {
      label: `ver:${p.split('/').pop()}`,
      phase: 'Dogrulama',
      agentType: 'general-purpose',
      model: 'opus',
      effort: 'high',
      schema: SCHEMA,
    }).then((r) => (r && r.verdicts) || [])
  )
);

const flat = results.filter(Boolean).flat();
log(`Dogrulama bitti: ${files.length} dosya, ${flat.length} verdict.`);
return { fileCount: files.length, verdictCount: flat.length, verdicts: flat };
