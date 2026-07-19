export const meta = {
  name: 'tus-triage',
  description: 'TUS soru bankasi tibbi/dil/mantik triyaji (batch basina 1 agent)',
  phases: [{ title: 'Triyaj', detail: 'Her batch bir Sonnet agent tarafindan denetlenir' }],
};

// args: { dir: "/abs/batches", subjects: [{slug, count}] }
const A = typeof args === 'string' ? JSON.parse(args) : (args || {});
const dir = A.dir;
const subjects = A.subjects || [];

// batch yollarini slug+count'tan yeniden insa et
const batches = [];
for (const s of subjects) {
  for (let i = 0; i < s.count; i++) {
    const n = String(i).padStart(3, '0');
    batches.push(`${dir}/${s.slug}-${n}.json`);
  }
}

const SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      description: 'SADECE sorunlu sorular. Sorunsuz sorulari ekleme.',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          category: {
            type: 'string',
            enum: ['wrong_answer', 'medical_accuracy', 'language', 'logic_consistency', 'ambiguous', 'outdated', 'explanation_error', 'quality'],
          },
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          issue: { type: 'string', description: 'Turkce: sorun net ve spesifik olarak nedir' },
          proposedFix: { type: 'string', description: 'Turkce: cozum onerisi. wrong_answer ise dogru sikkin harfini (A-E) ve gerekcesini yaz.' },
        },
        required: ['id', 'category', 'severity', 'issue', 'proposedFix'],
      },
    },
  },
  required: ['findings'],
};

const triagePrompt = (p) => `Sen TUS (Tipta Uzmanlik Sinavi) soru bankasi denetleyen kidemli bir tip egitmeni ve editorsun. Turkiye TUS mufredatina hakimsin.

GOREV: Read araciyla su dosyayi oku: ${p}
Dosya, JSON dizisi halinde TUS sorulari icerir. Her sorunun alanlari: id, ders, konu, diff (zorluk 1-5), q (soru koku), options (5 sik dizisi), correct (dogru sikkin 0-tabanli indeksi; 0=A,1=B,2=C,3=D,4=E), exp (aciklama).

Her soruyu su acilardan TEK TEK denetle:
1. wrong_answer: "correct" ile isaretlenen sik gercekten tibben dogru mu? Baska bir sik daha dogruysa VEYA isaretli sik yanlissa BUNU BILDIR (en kritik kategori). Sadece net emin oldugunda wrong_answer de.
2. medical_accuracy: Soru kokunde, siklarda veya aciklamada tibbi hata/yanlis bilgi (yanlis doz, yanlis mekanizma, yanlis eslestirme, guncelligini yitirmis bilgi) var mi?
3. explanation_error: exp aciklamasi isaretli dogru sik ile CELISIYOR mu, ya da baska bir sikki dogru gibi anlatiyor mu? Aciklama hatali/eksik/celiskili mi?
4. logic_consistency: Soru kendi icinde tutarli mi? Sik/veri celiskisi, birden fazla dogru sik, hicbiri dogru degil, ipucu iceren mantik hatasi var mi?
5. ambiguous: Soru birden fazla gecerli yoruma aciksa, veri eksikse, "en olasi/en uygun" ayrimi belirsizse.
6. language: Turkce dil bilgisi, imla, terminoloji hatasi, bozuk/anlasilmaz cumle, kesik metin.
7. quality: Giveaway (dogru sik belirgin uzun/farkli), gereksiz uzunluk, tekrar, TUS formatina uymayan yapi.

KURALLAR:
- Sadece GERCEK ve SPESIFIK sorunlari bildir. Kildan kil yarma; kucuk stil tercihlerini yazma. Emin olmadigin tibbi iddialar icin minor/ambiguous kullan, uydurma.
- Bir soruda birden fazla sorun varsa en onemli 1-2 tanesini ayri finding olarak yaz.
- Sorunsuz sorular icin HICBIR SEY yazma.
- Tum issue ve proposedFix metinleri TURKCE olacak.
- wrong_answer/medical_accuracy en yuksek oncelik; bunlarda severity genelde critical/major.

Ciktiyi StructuredOutput semasina gore ver: { findings: [...] }. Sorun yoksa { findings: [] }.`;

const results = await parallel(
  batches.map((p) => () =>
    agent(triagePrompt(p), {
      label: `tri:${p.split('/').pop()}`,
      phase: 'Triyaj',
      agentType: 'general-purpose',
      model: 'sonnet',
      effort: 'high',
      schema: SCHEMA,
    }).then((r) => ({ batch: p, findings: (r && r.findings) || [] }))
  )
);

const flat = results.filter(Boolean).flatMap((r) => r.findings.map((f) => ({ ...f, batch: r.batch })));
log(`Triyaj bitti: ${batches.length} batch, ${flat.length} bulgu.`);
return { batchCount: batches.length, findingCount: flat.length, findings: flat };
