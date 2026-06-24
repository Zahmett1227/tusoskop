import React, { useEffect, useMemo } from "react";
import SignInOptions from "../auth/SignInOptions";
import AppStoreBadge from "../AppStoreBadge";
import {
  APP_STORE_URL,
  BRAND_NAME,
  OG_IMAGE,
  SITE_URL,
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

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

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
          <a className="hover:text-white" href="/tusoskop-fiyatlandirma">Fiyatlandırma</a>
          <a className="hover:text-white" href="/tusoskop-sss">SSS</a>
        </nav>
        <a
          href="#basla"
          className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200"
        >
          Hemen Başla
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
    ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
    ["Fiyatlandırma", "/tusoskop-fiyatlandirma"],
    ["Sık Sorulan Sorular", "/tusoskop-sss"],
    ["Gizlilik Sözleşmesi", "/gizlilik-sozlesmesi"],
    ["Kullanım Koşulları", "/kullanim-kosullari"],
    ["App Store", APP_STORE_URL],
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
        <div className="grid gap-6">
          <nav aria-label="SEO ve yasal bağlantılar" className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {links.map(([label, href]) => (
              <a key={label} href={href} className="font-semibold text-slate-400 hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <nav aria-label="Branş bağlantıları" className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {subjectIndexLinks.map(([label, href]) => (
              <a key={href} href={href} className="font-semibold text-slate-400 hover:text-white">
                {label}
              </a>
            ))}
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

export function SeoLandingPage({ page }) {
  const faq = useMemo(() => page.faq ?? commonFaq, [page.faq]);
  const path = `/${page.slug}`;
  usePageMetadata({
    title: page.title,
    description: page.description,
    path,
    faq,
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
                {faq.slice(0, 6).map((item) => (
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
