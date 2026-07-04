import React, { useEffect, useMemo, useState } from "react";
import SignInOptions from "../auth/SignInOptions";
import AppStoreBadge from "../AppStoreBadge";
import {
  TUS_SECTION_QUESTIONS,
  TUS_BARAJ_PUANI,
  TEMEL_ORTALAMA,
  KLINIK_ORTALAMA,
  T_PUANI_AGIRLIK,
  K_PUANI_AGIRLIK,
  TUS_DEDUCTION_RATE,
  calculateTusResult,
  computeBlank,
  isSectionOverflow,
  applyScoreDeduction,
  netForTargetPuan,
  puanBandi,
} from "../../seo/tusScoring";
import {
  APP_STORE_URL,
  BRAND_NAME,
  OG_IMAGE,
  SITE_URL,
  buildSiteNavigationNodes,
  commonFaq,
  homeSeo,
  pageUrl,
  HERO_STATS,
  QUESTION_COUNT_LABEL,
  FREE_DAILY_QUESTIONS,
  FREE_DAILY_TOPIC_TESTS,
  LESSON_COUNT,
  subjectIndexLinks,
} from "../../seo/seoContent";
import { KONTENJAN_DATA, KONTENJAN_DONEM_LABEL } from "../../seo/kontenjanData";
import { getDoluluk, getDolulukYuzde, getRekabetTier, getMatchLevel } from "../../seo/kontenjanMetrics";
import { SUBJECTS } from "../../data/subjects";

const OPTION_KEYS = ["A", "B", "C", "D", "E"];
const TEMEL_DERSLER = SUBJECTS.filter((s) => s.type === "Temel").map((s) => s.name);
const KLINIK_DERSLER = SUBJECTS.filter((s) => s.type === "Klinik").map((s) => s.name);

function StatGrid({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-4 text-center">
          <p className="text-2xl font-black tracking-tight text-emerald-300">{stat.value}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function SampleQuestionCard({ sample, subject }) {
  if (!sample) return null;
  return (
    <section aria-label="Örnek soru" className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/55 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-950">
          Örnek Soru
        </span>
        <span className="text-sm font-bold text-slate-400">
          {subject ? `${subject} · ` : ""}{sample.konu}
        </span>
      </div>
      <p className="mt-4 text-lg font-bold leading-relaxed text-white">{sample.q}</p>
      <ul className="mt-4 space-y-2">
        {sample.options.map((option, index) => {
          const isCorrect = index === sample.correct;
          return (
            <li
              key={option}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                isCorrect
                  ? "border-emerald-300/70 bg-emerald-300/10 text-emerald-50"
                  : "border-slate-700 text-slate-200"
              }`}
            >
              <span className={`font-black ${isCorrect ? "text-emerald-300" : "text-slate-400"}`}>
                {OPTION_KEYS[index] ?? index + 1}
              </span>
              <span>{option}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 border-t border-slate-800 pt-4">
        <p className="text-sm font-black text-emerald-300">Doğru cevap: {OPTION_KEYS[sample.correct]}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{sample.exp}</p>
      </div>
    </section>
  );
}

function SubjectTopics({ subject, topics }) {
  if (!topics?.length) return null;
  return (
    <section aria-label={`${subject} konuları`} className="mt-8">
      <h2 className="text-2xl font-black tracking-tight">{subject} konuları</h2>
      <p className="mt-2 text-base leading-relaxed text-slate-300">
        Tusoskop&apos;ta {subject} dersini şu konulara ayırarak konu konu çözebilirsin:
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <li
            key={topic}
            className="rounded-2xl border border-slate-700 bg-slate-900/55 px-3.5 py-2 text-sm font-bold text-slate-200"
          >
            {topic}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SubjectIndex() {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-black tracking-tight">Branşına Göre TUS Soruları</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
          {QUESTION_COUNT_LABEL} soruyu {LESSON_COUNT} dersten ve istediğin konudan seçerek çöz. Her branşta gerçek örnek soruları incele.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {subjectIndexLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-emerald-300/70 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function setMeta(selector, attributes) {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function setLink(rel, href) {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function buildFaqSchema(faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function usePageMetadata({ title, description, path = "/", faq = commonFaq, breadcrumbs = [] }) {
  useEffect(() => {
    const url = pageUrl(path);
    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setLink("canonical", url);
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });
    setMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    setMeta('meta[property="og:image"]', { property: "og:image", content: OG_IMAGE });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: OG_IMAGE });

    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: BRAND_NAME,
        url: SITE_URL,
        logo: OG_IMAGE,
        sameAs: [APP_STORE_URL],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: BRAND_NAME,
        url: SITE_URL,
        inLanguage: "tr-TR",
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: BRAND_NAME,
        applicationCategory: "EducationalApplication",
        operatingSystem: "iOS, Web",
        description,
        url: SITE_URL,
        sameAs: [APP_STORE_URL],
        offers: {
          "@type": "Offer",
          priceCurrency: "TRY",
          availability: "https://schema.org/InStock",
        },
      },
      buildFaqSchema(faq),
      ...buildSiteNavigationNodes().map((node) => ({
        "@context": "https://schema.org",
        ...node,
      })),
    ];

    if (breadcrumbs.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: pageUrl(item.path),
        })),
      });
    }

    let script = document.head.querySelector("#tusoskop-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "tusoskop-jsonld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemas);
  }, [breadcrumbs, description, faq, path, title]);
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/88 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-3 text-white no-underline">
          <img src="/tusoskop-mark.png" alt="" className="h-9 w-9 rounded-lg object-contain" width="36" height="36" />
          <span className="text-lg font-black tracking-tight">Tusoskop</span>
        </a>
        <nav aria-label="Ana bağlantılar" className="hidden items-center gap-5 text-sm font-bold text-slate-300 md:flex">
          <a className="hover:text-white" href="/tusoskop-nedir">Nedir?</a>
          <a className="hover:text-white" href="/tusoskop-ozellikleri">Özellikler</a>
          <a className="hover:text-white" href="/tus-puan-hesaplama">Puan Hesaplama</a>
          <a className="hover:text-white" href="/tus-kontenjan-tablosu">Kontenjanlar</a>
          <a className="hover:text-white" href="/fiyatlandirma">Fiyatlandırma</a>
          <a className="hover:text-white" href="/hakkimizda">Hakkımızda</a>
          <a className="hover:text-white" href="/tusoskop-sss">SSS</a>
        </nav>
        <a
          href="/giris"
          className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200"
        >
          Giriş Yap
        </a>
      </div>
    </header>
  );
}

function PublicFooter() {
  const links = [
    ["Tusoskop Nedir?", "/tusoskop-nedir"],
    ["TUS Hazırlık Platformu", "/tus-hazirlik-platformu"],
    ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
    ["TUS Deneme Analizi", "/tus-deneme-analizi"],
    ["TUS Puan Hesaplama", "/tus-puan-hesaplama"],
    ["TUS Kontenjan Tablosu", "/tus-kontenjan-tablosu"],
    ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
    ["Fiyatlandırma", "/fiyatlandirma"],
    ["Hakkımızda", "/hakkimizda"],
    ["Sık Sorulan Sorular", "/tusoskop-sss"],
    ["Gizlilik Sözleşmesi", "/gizlilik-sozlesmesi"],
    ["Kullanım Koşulları", "/kullanim-kosullari"],
    ["App Store", APP_STORE_URL],
    ["Giriş Yap", "/giris"],
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-4 py-10 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_2fr]">
        <div>
          <p className="text-sm font-black text-white">© 2026 Tusoskop</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            TUS hazırlığında soru çözme, deneme, tekrar, AI çalışma planı, haftalık lig ve analiz sürecini kolaylaştıran dijital platform.
          </p>
        </div>
        <div className="grid gap-5">
          <nav aria-label="SEO ve yasal bağlantılar" className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {links.map(([label, href]) => (
              <a key={label} href={href} className="font-semibold text-slate-400 hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <nav aria-label="Branşa göre TUS soruları">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Branşa göre sorular</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
              {subjectIndexLinks.map(([label, href]) => (
                <a key={href} href={href} className="font-semibold text-slate-400 hover:text-white">
                  {label.replace(/^TUS\s+/, "").replace(/\s+Soruları$/, "")}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function AnswerBox({ children }) {
  return (
    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-5 text-sm leading-relaxed text-emerald-50 md:text-base">
      {children}
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
    </article>
  );
}

export function PublicHome({ accentTheme, onAppleLogin, onGoogleLogin }) {
  usePageMetadata({
    title: homeSeo.title,
    description: homeSeo.description,
    path: "/",
    faq: commonFaq,
  });

  const features = [
    [
      `${QUESTION_COUNT_LABEL} Soruyu Konu Konu Çöz`,
      `${LESSON_COUNT} dersten ve istediğin konudan seçerek yüksek kaliteli, TUS tarzı sorular çöz; çalıştığın konuyu hemen sına.`,
    ],
    ["Deneme Çöz", "TUS hazırlık sürecinde dijital denemelerle performansını ölç, neti zamanla takip et."],
    [
      "Akıllı Tekrar (FSRS)",
      "Yanlış yaptığın soruyu, beynin tam unutmaya başladığı anda bilimsel aralıklı tekrarla yeniden karşına çıkarırız.",
    ],
    [
      `Günde ${FREE_DAILY_QUESTIONS} Soru Ücretsiz`,
      `Free planda her gün ${FREE_DAILY_QUESTIONS} soru ve ${FREE_DAILY_TOPIC_TESTS} konu testi ücretsiz. Nöbet arasında telefonundan çöz.`,
    ],
    [
      "AI Çalışma Planı",
      "Yapay zeka eksik konularını bulup sana günlük çalışma planı çıkarsın; neyi çözeceğini düşünme.",
    ],
    ["Haftalık Ligde Yarış", "Binlerce TUS adayıyla aynı ligde yarış, haftalık sıralamada yüksel ve motivasyonunu koru."],
  ];

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <PublicHeader />
      <main>
        <section className="px-4 pb-12 pt-14 md:pb-16 md:pt-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">TUSOSKOP</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
                {homeSeo.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                Tusoskop; TUS'a hazırlanan tıp öğrencileri ve hekimler için konu bazlı test, deneme çözümü, yanlış/favori takibi, AI çalışma planı, haftalık lig ve performans analizi sunan mobil odaklı dijital çalışma platformudur.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#basla" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-6 font-black text-slate-950 hover:bg-emerald-200">
                  Hemen Başla
                </a>
                <a href={APP_STORE_URL} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-700 px-6 font-black text-white hover:border-slate-500">
                  App Store'da Gör
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-5 shadow-2xl shadow-black/30">
              <AnswerBox>{homeSeo.answer}</AnswerBox>
              <div className="mt-5">
                <StatGrid stats={HERO_STATS} />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/35 px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-black tracking-tight">Tusoskop ile Ne Yapabilirsin?</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([title, body]) => (
                <FeatureCard key={title} title={title} body={body} />
              ))}
            </div>
          </div>
        </section>

        <SubjectIndex />

        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <article>
              <h2 className="text-3xl font-black tracking-tight">Tusoskop Kimler İçin Uygun?</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Tusoskop; TUS'a hazırlanan, konu çalıştıktan sonra soru çözmek isteyen, denemelerle ilerlemesini görmek isteyen ve yanlışlarını düzenli takip etmek isteyen tıp öğrencileri ve hekimler için uygundur.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Ana odağı video ders değil; soru çözme, tekrar, deneme, AI destekli planlama, haftalık motivasyon ve analiz sürecini daha düzenli hale getirmektir.
              </p>
            </article>
            <article>
              <h2 className="text-3xl font-black tracking-tight">Mobil Kullanım</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Tusoskop'u iOS cihazında App Store üzerinden indirebilir, web üzerinden de kullanabilirsin. Mobil odaklı yapı, kısa boşluklarda soru çözme ve analiz takip etmeyi kolaylaştırır.
              </p>
              <div className="mt-5">
                <AppStoreBadge />
              </div>
            </article>
          </div>
        </section>

        <section id="basla" className="border-t border-slate-800 bg-slate-900/35 px-4 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Kullanım amacı ve dürüst konumlandırma</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Tusoskop'un ana odağı; TUS hazırlığında soru çözme, tekrar, deneme ve analiz sürecini dijital olarak kolaylaştırmaktır. Konu anlatımı veya kapsamlı kurs deneyimi yerine, çalıştığın konuyu test etme ve ilerlemeni takip etme tarafında konumlanır.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-xl font-black">Tusoskop'a Başla</h2>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-400">
                Web üzerinden giriş yapabilir veya iOS cihazında App Store bağlantısını kullanabilirsin.
              </p>
              <SignInOptions
                accentTheme={accentTheme}
                onAppleLogin={onAppleLogin}
                onGoogleLogin={onGoogleLogin}
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-black tracking-tight">Sık Sorulan Sorular</h2>
            <div className="mt-6 divide-y divide-slate-800 rounded-3xl border border-slate-800 bg-slate-900/45">
              {commonFaq.map((item) => (
                <details key={item.question} className="group p-5">
                  <summary className="cursor-pointer text-base font-black text-white">{item.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function ScoreInput({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        max={TUS_SECTION_QUESTIONS}
        value={value}
        onChange={onChange}
        placeholder="0"
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-bold text-white outline-none focus:border-emerald-300/70"
      />
    </label>
  );
}

function ScoreSection({ title, dogruId, yanlisId, dogru, yanlis, onDogru, onYanlis, net, blank, overflow }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-white">{title}</h3>
        <span className="text-sm font-bold text-emerald-300">Net: {net}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ScoreInput id={dogruId} label="Doğru" value={dogru} onChange={onDogru} />
        <ScoreInput id={yanlisId} label="Yanlış" value={yanlis} onChange={onYanlis} />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">
        Boş: {blank} / {TUS_SECTION_QUESTIONS}
      </p>
      {overflow ? (
        <p className="mt-1 text-xs font-bold text-rose-400">Bu bölümde en fazla {TUS_SECTION_QUESTIONS} soru olabilir.</p>
      ) : null}
    </div>
  );
}

function DeductionToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3.5 text-left"
    >
      <span>
        <span
          className="flex items-center gap-1.5 text-sm font-black text-amber-100"
          title="Daha önce bir TUS ile uzmanlık/yan dal eğitimine yerleşip devam etmemiş adaylara ÖSYM tarafından uygulanan kesinti."
        >
          %5 Puan Kesintisi <span aria-hidden>ⓘ</span>
        </span>
        <span className="mt-0.5 block text-xs font-medium text-amber-200/80">
          Daha önce TUS ile yerleşip devam etmemiş adaylar için geçerli
        </span>
      </span>
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-400" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

function PuanTuruBadge({ puanTuru, size = "sm" }) {
  const isT = puanTuru === "T";
  const sizing = size === "sm" ? "h-4 w-4 text-[10px]" : "h-5 w-5 text-xs";
  return (
    <span
      title={isT ? "T Puanı" : "K Puanı"}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-black ${sizing} ${
        isT ? "border-sky-300/40 bg-sky-300/10 text-sky-200" : "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
      }`}
    >
      {puanTuru}
    </span>
  );
}

const REKABET_STYLES = {
  cokRekabetci: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  rekabetci: "border-orange-300/40 bg-orange-300/10 text-orange-200",
  orta: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  erisilebilir: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
  dolmadi: "border-slate-600/50 bg-slate-700/20 text-slate-300",
};

function RekabetBadge({ row }) {
  const tier = getRekabetTier(row);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${
        REKABET_STYLES[tier.key] ?? REKABET_STYLES.dolmadi
      }`}
    >
      {tier.label}
    </span>
  );
}

function DolulukCell({ row }) {
  const yuzde = getDolulukYuzde(row);
  if (yuzde == null) return <span className="text-slate-500">—</span>;
  const full = yuzde >= 100;
  return (
    <span className="flex items-center gap-2">
      <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-700 sm:block" aria-hidden>
        <span
          className={`block h-full rounded-full ${full ? "bg-emerald-400" : yuzde >= 90 ? "bg-sky-400" : "bg-amber-400"}`}
          style={{ width: `${Math.min(yuzde, 100)}%` }}
        />
      </span>
      <span className="font-semibold text-slate-300">%{yuzde}</span>
    </span>
  );
}

function PuanCard({ label, value, band, puanTuru, usedBy }) {
  const isT = puanTuru === "T";
  const accent = isT
    ? { border: "border-sky-300/40", bg: "bg-sky-300/10", text: "text-sky-300", soft: "text-sky-100/80" }
    : { border: "border-emerald-300/40", bg: "bg-emerald-300/10", text: "text-emerald-300", soft: "text-emerald-100/80" };
  return (
    <div className={`rounded-2xl border ${accent.border} ${accent.bg} px-4 py-4 text-center`}>
      <p className={`text-xs font-bold ${accent.text}`}>{label}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>
      <p className={`mt-1 text-xs font-semibold ${accent.soft}`}>{band.label} · {band.advice}</p>
      <p className="mt-2 text-[11px] font-semibold text-slate-500">{usedBy}</p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <summary className="cursor-pointer text-sm font-black text-white">Nasıl hesaplanıyor?</summary>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
        <p>
          <span className="font-bold text-slate-300">1. Standart puan:</span> her bölümün neti, o bölümün ortalama ve
          standart sapmasına göre 50 ortalamalı bir standart puana çevrilir: <span className="font-mono text-slate-300">SP = 50 + 10 × (Net − Ortalama) / Standart Sapma</span>.
        </p>
        <p>
          <span className="font-bold text-slate-300">2. Ağırlıklı birleşim:</span>{" "}
          <span className="font-bold text-sky-300">T Puanı</span> = %{T_PUANI_AGIRLIK.temel * 100} Temel + %{T_PUANI_AGIRLIK.klinik * 100} Klinik ·{" "}
          <span className="font-bold text-emerald-300">K Puanı</span> = %{K_PUANI_AGIRLIK.temel * 100} Temel + %{K_PUANI_AGIRLIK.klinik * 100} Klinik.
        </p>
        <p>
          <span className="font-bold text-slate-300">3. Baraj:</span> T veya K puanından {TUS_BARAJ_PUANI} puanın altında kalan bir puan türüyle tercih yapılamaz.
        </p>
        <p className="pt-1 text-slate-500">
          ÖSYM, dönem bazlı ortalama/standart sapmayı resmi olarak yayımlamaz. Buradaki hesaplama Temel ≈{TEMEL_ORTALAMA} ve Klinik ≈{KLINIK_ORTALAMA} net ortalamasına dayalı yaklaşık bir referans kullanır; gerçek dönem istatistikleri farklı olabilir.
        </p>
      </div>
    </details>
  );
}

function ReverseCalcResult({ label, netValue, sectionLabel }) {
  const valid = Number.isFinite(netValue);
  const overCap = valid && netValue > TUS_SECTION_QUESTIONS;
  const underZero = valid && netValue < 0;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">
        {!valid ? "—" : underZero ? "Zaten üzerinde" : overCap ? `${TUS_SECTION_QUESTIONS}+` : netValue}
      </p>
      {overCap ? (
        <p className="mt-1 text-[11px] font-semibold text-amber-300">{sectionLabel} tek başına yetmiyor, diğer bölümü de artırman gerekir.</p>
      ) : null}
    </div>
  );
}

function TusScoreCalculator() {
  const [v, setV] = useState({ td: "", ty: "", kd: "", ky: "" });
  const [kesinti, setKesinti] = useState(false);
  const [hedef, setHedef] = useState("");
  const [hedefTuru, setHedefTuru] = useState("K");

  const set = (key) => (event) => {
    const raw = event.target.value.replace(/[^0-9]/g, "");
    const capped = raw === "" ? "" : String(Math.min(Number(raw), TUS_SECTION_QUESTIONS));
    setV((prev) => ({ ...prev, [key]: capped }));
  };

  const result = useMemo(
    () =>
      calculateTusResult({
        temelDogru: v.td,
        temelYanlis: v.ty,
        klinikDogru: v.kd,
        klinikYanlis: v.ky,
      }),
    [v]
  );

  const hasInput = v.td || v.ty || v.kd || v.ky;
  const displayTPuani = kesinti ? applyScoreDeduction(result.tPuani, true) : result.tPuani;
  const displayKPuani = kesinti ? applyScoreDeduction(result.kPuani, true) : result.kPuani;
  const tBand = useMemo(() => puanBandi(displayTPuani), [displayTPuani]);
  const kBand = useMemo(() => puanBandi(displayKPuani), [displayKPuani]);
  const temelBlank = computeBlank(v.td, v.ty);
  const klinikBlank = computeBlank(v.kd, v.ky);
  const temelOverflow = isSectionOverflow(v.td, v.ty);
  const klinikOverflow = isSectionOverflow(v.kd, v.ky);

  const handleHedef = (event) => {
    setHedef(event.target.value.replace(/[^0-9.]/g, ""));
  };
  const hedefNum = Number(hedef);
  const hedefValid = hedef !== "" && Number.isFinite(hedefNum) && hedefNum > 0;
  const hedefEffective = hedefValid && kesinti ? hedefNum / (1 - TUS_DEDUCTION_RATE) : hedefNum;
  const reverse = useMemo(
    () =>
      hedefValid
        ? netForTargetPuan({
            targetPuan: hedefEffective,
            puanTuru: hedefTuru,
            fixedTemelNet: result.temelNet,
            fixedKlinikNet: result.klinikNet,
          })
        : { neededTemelNet: null, neededKlinikNet: null },
    [hedefValid, hedefEffective, hedefTuru, result.temelNet, result.klinikNet]
  );

  return (
    <section aria-label="TUS puan hesaplama aracı" className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/55">
      <div className="h-1 w-full bg-gradient-to-r from-sky-300 via-emerald-300 to-emerald-400" aria-hidden />
      <div className="p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreSection
          title="Temel Tıp Bilimleri"
          dogruId="temel-dogru"
          yanlisId="temel-yanlis"
          dogru={v.td}
          yanlis={v.ty}
          onDogru={set("td")}
          onYanlis={set("ty")}
          net={result.temelNet}
          blank={temelBlank}
          overflow={temelOverflow}
        />
        <ScoreSection
          title="Klinik Tıp Bilimleri"
          dogruId="klinik-dogru"
          yanlisId="klinik-yanlis"
          dogru={v.kd}
          yanlis={v.ky}
          onDogru={set("kd")}
          onYanlis={set("ky")}
          net={result.klinikNet}
          blank={klinikBlank}
          overflow={klinikOverflow}
        />
      </div>

      <DeductionToggle checked={kesinti} onChange={setKesinti} />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-center">
          <p className="text-xs font-bold text-slate-400">Toplam Net</p>
          <p className="mt-1 text-2xl font-black text-white">{result.toplamNet}</p>
          {kesinti ? <p className="mt-1 text-[11px] font-semibold text-amber-300/80">−%5 kesintili gösteriliyor</p> : null}
        </div>
        <PuanCard
          label="T Puanı"
          value={hasInput ? displayTPuani : "—"}
          band={hasInput ? tBand : { label: "", advice: "Doğru ve yanlış sayını gir" }}
          puanTuru="T"
          usedBy={`${TEMEL_DERSLER.length} temel ders (${TEMEL_DERSLER.join(", ")})`}
        />
        <PuanCard
          label="K Puanı"
          value={hasInput ? displayKPuani : "—"}
          band={hasInput ? kBand : { label: "", advice: "Doğru ve yanlış sayını gir" }}
          puanTuru="K"
          usedBy={`${KLINIK_DERSLER.length} klinik ders (${KLINIK_DERSLER.join(", ")})`}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Sonuç tahminidir. Net = doğru − yanlış/4. TUS'ta tek bir puan değil, ayrı ayrı <span className="font-bold text-sky-300">T Puanı</span> ve{" "}
        <span className="font-bold text-emerald-300">K Puanı</span> hesaplanır; hangi dala yerleşeceğine göre ilgili puan geçerlidir.
      </p>

      {hasInput ? <BranchMatchPanel tPuani={displayTPuani} kPuani={displayKPuani} /> : null}

      <MethodologyNote />

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h3 className="text-base font-black text-white">Hedef puana kaç net gerekir?</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Hedef puan türünü ve puanı gir; bir bölümdeki mevcut netini sabit tutup diğer bölümde gereken neti hesaplayalım
          {kesinti ? " (kesinti anahtarı açıkken hedefin kesinti sonrası puan olarak alındığı varsayılır)" : ""}.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-slate-300">Puan Türü</span>
            <div className="flex overflow-hidden rounded-2xl border border-slate-700">
              {["T", "K"].map((tur) => (
                <button
                  key={tur}
                  type="button"
                  onClick={() => setHedefTuru(tur)}
                  className={`px-4 py-3 text-sm font-black transition-colors ${
                    hedefTuru === tur ? (tur === "T" ? "bg-sky-300 text-slate-950" : "bg-emerald-300 text-slate-950") : "bg-slate-900 text-slate-400"
                  }`}
                >
                  {tur} Puanı
                </button>
              ))}
            </div>
          </div>
          <label htmlFor="hedef-puan" className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-slate-300">Hedef Puan</span>
            <input
              id="hedef-puan"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              value={hedef}
              onChange={handleHedef}
              placeholder="örn. 55"
              className="w-40 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base font-bold text-white outline-none focus:border-emerald-300/70"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ReverseCalcResult
            label={`Temel net ${result.temelNet || 0} sabit kalırsa, gereken Klinik net`}
            netValue={reverse.neededKlinikNet}
            sectionLabel="Klinik bölüm"
          />
          <ReverseCalcResult
            label={`Klinik net ${result.klinikNet || 0} sabit kalırsa, gereken Temel net`}
            netValue={reverse.neededTemelNet}
            sectionLabel="Temel bölüm"
          />
        </div>
      </div>
      </div>
    </section>
  );
}

function relevantScore(row, tPuani, kPuani) {
  return row.puanTuru === "T" ? tPuani : kPuani;
}

function BranchMatchPanel({ tPuani, kPuani }) {
  const hasScore = (tPuani > 0 || kPuani > 0);
  const { rahat, sinirda, openQuota, near } = useMemo(() => {
    if (!hasScore) return { rahat: [], sinirda: [], openQuota: [], near: [] };
    const rahat = [];
    const sinirda = [];
    const openQuota = [];
    const near = [];
    KONTENJAN_DATA.forEach((r) => {
      const score = relevantScore(r, tPuani, kPuani);
      const level = getMatchLevel(r, score);
      if (level === "rahat") rahat.push(r);
      else if (level === "sinirda") sinirda.push(r);
      else if (level === "acik") openQuota.push(r);
      else near.push(r);
    });
    // Rahat: en yüksek ortalamalı (en prestijli) önce.
    rahat.sort((a, b) => b.ortalamaPuan - a.ortalamaPuan);
    // Sınırda: ortalamaya en yakın olan (en ulaşılabilir rekabetçi) önce.
    sinirda.sort((a, b) => a.ortalamaPuan - b.ortalamaPuan);
    // Az kalanlar: tabana en yakın olan önce.
    near.sort(
      (a, b) =>
        a.tabanPuan - relevantScore(a, tPuani, kPuani) - (b.tabanPuan - relevantScore(b, tPuani, kPuani))
    );
    return { rahat, sinirda, openQuota, near: near.slice(0, 5) };
  }, [hasScore, tPuani, kPuani]);

  if (!hasScore) return null;

  const totalQualifies = rahat.length + sinirda.length + openQuota.length;

  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="text-base font-black text-white">Bu puanla hangi dallara girebilirsin?</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        {KONTENJAN_DONEM_LABEL} verisine göre yaklaşık kıyaslama — her dal kendi puan türüyle (T veya K) karşılaştırılır.
        Bir dala <span className="font-bold text-emerald-300">taban puanla</span> girmek mümkün olsa da,{" "}
        <span className="font-bold text-amber-300">ortalama puanın</span> altındaysan alt sıralarda ve rekabetçi kalırsın.
        Puanlar dönemden döneme değişir; bu bir garanti değil, referanstır.
      </p>

      {totalQualifies === 0 ? (
        <p className="mt-4 text-sm font-bold text-amber-300">
          Bu puanla geçen dönem taban puanı oluşan hiçbir dala girebilmiş değilsin
          {openQuota.length ? `, ancak kontenjanı hiç dolmayan ${openQuota.length} dal her zaman açık kalıyor.` : "."}
        </p>
      ) : null}

      {rahat.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300/80">
            Rahat girersin <span className="text-slate-500">(ortalamanın en az +1.5 üzerindesin)</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {rahat.map((r) => (
              <li
                key={r.dal}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100"
              >
                <PuanTuruBadge puanTuru={r.puanTuru} />
                <span>{r.dal}</span>
                <span className="rounded-full border border-emerald-200/35 bg-slate-950/45 px-2 py-0.5 text-[11px] font-black text-emerald-200">
                  taban {r.tabanPuan}
                </span>
                <span className="rounded-full border border-emerald-200/35 bg-slate-950/45 px-2 py-0.5 text-[11px] font-black text-emerald-200">
                  ort. {r.ortalamaPuan}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sinirda.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-300/80">
            Sınırda / rekabetçi <span className="text-slate-500">(taban üstü, ortalamaya +1.5’e kadar yakın)</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {sinirda.map((r) => (
              <li
                key={r.dal}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100"
              >
                <PuanTuruBadge puanTuru={r.puanTuru} />
                <span>{r.dal}</span>
                <span className="rounded-full border border-amber-200/35 bg-slate-950/45 px-2 py-0.5 text-[11px] font-black text-amber-200">
                  taban {r.tabanPuan}
                </span>
                <span className="rounded-full border border-amber-200/35 bg-slate-950/45 px-2 py-0.5 text-[11px] font-black text-amber-200">
                  ort. {r.ortalamaPuan}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {openQuota.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Kontenjanı dolmayan dallar</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {openQuota.map((r) => (
              <li
                key={r.dal}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-bold text-slate-300"
              >
                <PuanTuruBadge puanTuru={r.puanTuru} />
                {r.dal} <span className="text-slate-500">· kontenjan dolmadı</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {near.length > 0 ? (
        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Az kalanlar</p>
          <ul className="mt-2 space-y-1.5">
            {near.map((r) => (
              <li key={r.dal} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <PuanTuruBadge puanTuru={r.puanTuru} />
                  {r.dal}
                </span>
                <span className="font-bold text-slate-400">
                  {r.tabanPuan}{" "}
                  <span className="text-xs text-slate-500">
                    (+{Math.round((r.tabanPuan - relevantScore(r, tPuani, kPuani)) * 10) / 10} puan)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <a
        href="/tus-kontenjan-tablosu"
        className="mt-5 inline-flex items-center text-sm font-bold text-emerald-300 hover:text-emerald-200"
      >
        Tüm kontenjan tablosunu gör →
      </a>
    </div>
  );
}

function KontenjanTable({ data, donem }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("ortalamaPuan");
  const [sortDir, setSortDir] = useState("desc");

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const q = query.trim().toLocaleLowerCase("tr");
    const filtered = q ? list.filter((r) => r.dal.toLocaleLowerCase("tr").includes(q)) : list;
    const nullLast = (sortKey === "tabanPuan" || sortKey === "ortalamaPuan" || sortKey === "tavanPuan");
    const val = (r) => {
      if (sortKey === "doluluk") return getDoluluk(r) ?? -1;
      const raw = r[sortKey];
      if (raw == null) return nullLast ? -1 : 0;
      return raw;
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv, "tr") : bv.localeCompare(av, "tr");
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "dal" ? "asc" : "desc");
    }
  };

  const arrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <section aria-label="TUS kontenjan tablosu" className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Uzmanlık dalı ara…"
          className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-300/70"
        />
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{donem} · {Array.isArray(data) ? data.length : 0} dal</span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <PuanTuruBadge puanTuru="T" /> temel bilim · <PuanTuruBadge puanTuru="K" /> klinik
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Bir dalın rekabetini yalnızca <span className="font-semibold text-slate-300">taban puanla</span> değerlendirme:
        taban, o dala giren <span className="font-semibold text-slate-300">son kişinin</span> puanıdır.{" "}
        <span className="font-semibold text-emerald-300">Ortalama</span> ve{" "}
        <span className="font-semibold text-emerald-300">tavan</span> puan ile{" "}
        <span className="font-semibold text-emerald-300">rekabet</span> rozeti, dalın gerçek yarışını daha doğru gösterir.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-900/95 text-left text-xs font-black uppercase tracking-wide text-slate-400 backdrop-blur">
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("dal")}>
                Uzmanlık Dalı{arrow("dal")}
              </th>
              <th className="px-3 py-3">Tür</th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("ortalamaPuan")}>
                Rekabet{arrow("ortalamaPuan")}
              </th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("ortalamaPuan")}>
                Ortalama{arrow("ortalamaPuan")}
              </th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("tabanPuan")}>
                Taban–Tavan{arrow("tabanPuan")}
              </th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("kontenjan")}>
                Kontenjan{arrow("kontenjan")}
              </th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("doluluk")}>
                Doluluk{arrow("doluluk")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr
                key={r.dal}
                className={`border-t border-slate-800 transition-colors hover:bg-slate-900/60 ${index % 2 === 1 ? "bg-slate-900/25" : ""}`}
              >
                <td className="px-4 py-2.5 font-bold text-slate-200">{r.dal}</td>
                <td className="px-3 py-2.5"><PuanTuruBadge puanTuru={r.puanTuru} /></td>
                <td className="px-4 py-2.5"><RekabetBadge row={r} /></td>
                <td className="px-4 py-2.5 font-black text-emerald-300">{r.ortalamaPuan != null ? r.ortalamaPuan : "—"}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-400">
                  {r.tabanPuan != null ? (
                    <span>
                      {r.tabanPuan} <span className="text-slate-600">–</span> {r.tavanPuan}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 font-semibold text-slate-300">{r.kontenjan}</td>
                <td className="px-4 py-2.5"><DolulukCell row={r} /></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  Aramanla eşleşen dal bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SeoLandingPage({ page }) {
  const faq = useMemo(() => page.faq ?? commonFaq, [page.faq]);
  // JSON-LD FAQ şeması, sayfada görünen soru setiyle birebir aynı olmalı.
  const visibleFaq = useMemo(() => faq.slice(0, 6), [faq]);
  const path = `/${page.slug}`;
  usePageMetadata({
    title: page.title,
    description: page.description,
    path,
    faq: visibleFaq,
    breadcrumbs: [
      { name: "Ana sayfa", path: "/" },
      { name: page.h1, path },
    ],
  });

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <PublicHeader />
      <main>
        <article className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Tusoskop Rehberi</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">{page.h1}</h1>
            <div className="mt-6">
              <AnswerBox>{page.intro}</AnswerBox>
            </div>
            {page.stats?.length ? (
              <div className="mt-6">
                <StatGrid stats={page.stats} />
              </div>
            ) : null}
            <SampleQuestionCard sample={page.sample} subject={page.subject} />
            {page.isSubject ? <SubjectTopics subject={page.subject} topics={page.topics} /> : null}
            {page.tool === "score" ? <TusScoreCalculator /> : null}
            {page.tool === "kontenjan" ? (
              <KontenjanTable data={page.kontenjanData} donem={page.kontenjanDonem} />
            ) : null}
            <div className="mt-10 space-y-9">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-relaxed text-slate-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {page.links?.length ? (
              <nav aria-label="İlgili Tusoskop sayfaları" className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/45 p-5">
                <h2 className="text-lg font-black">İlgili bağlantılar</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {page.links.map(([label, href]) => (
                    <a key={label} href={href} className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-emerald-300/70 hover:text-white">
                      {label}
                    </a>
                  ))}
                </div>
              </nav>
            ) : null}

            <section className="mt-10">
              <h2 className="text-2xl font-black tracking-tight">Sık sorulan sorular</h2>
              <div className="mt-4 divide-y divide-slate-800 rounded-3xl border border-slate-800 bg-slate-900/45">
                {visibleFaq.map((item) => (
                  <details key={item.question} className="p-5">
                    <summary className="cursor-pointer font-black text-white">{item.question}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
