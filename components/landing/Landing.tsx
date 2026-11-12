import type { Metadata } from "next";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import HeroNoite from "@/components/landing/HeroNoite";
import CeuDoDia, { Horizonte } from "@/components/landing/CeuDoDia";
import Cabecalho from "@/components/landing/Cabecalho";
import OlheiroVivo, { VooOlheiro } from "@/components/landing/OlheiroVivo";
import Olheiro, { NIVEL_COR } from "@/components/landing/Olheiro";
import PauseButton from "@/components/landing/PauseButton";
import Reveal from "@/components/landing/Reveal";
import StoryDemo from "@/components/landing/StoryDemo";
import FadingPost from "@/components/landing/FadingPost";
import DaySection from "@/components/landing/DaySection";
import FirstInNeighborhood from "@/components/landing/FirstInNeighborhood";
import AdSimulator from "@/components/landing/AdSimulator";
import LazyScene from "@/components/landing/LazyScene";
import AchievementShowcase from "@/components/landing/AchievementShowcase";
import ExplainerVideo, { VideoLink } from "@/components/landing/ExplainerVideo";
import { DICT, type Lang } from "@/components/landing/i18n";
import { LangProvider } from "@/components/landing/lang";
import { CITY } from "@/lib/city";
import "@/app/landing.css";

// A LP, em pt-BR (/) e em inglês (/en). Quem já entrou ou vem de um link
// antigo (/?post=…) é mandado ao mapa pelo proxy.ts; o app instalado abre em
// /mapa pelo manifest.

const PATH: Record<Lang, string> = { pt: "/", en: "/en" };
const TICKER_COLOR = ["var(--warn)", "var(--accent)", "var(--warn)", "var(--danger)", "var(--warn)", "var(--accent)"];

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function landingMetadata(lang: Lang): Metadata {
  const m = DICT[lang].meta;
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: { canonical: PATH[lang], languages: { "pt-BR": "/", en: "/en", "x-default": "/" } },
    keywords: m.keywords,
    openGraph: {
      type: "website",
      locale: m.locale,
      alternateLocale: lang === "pt" ? "en_US" : "pt_BR",
      url: PATH[lang],
      siteName: "Viu na Cidade",
      title: m.ogTitle,
      description: m.description,
    },
    twitter: { card: "summary_large_image", title: m.ogTitle, description: m.description },
  };
}

function jsonLd(lang: Lang) {
  const t = DICT[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Viu na Cidade",
        url: SITE + (lang === "pt" ? "" : PATH[lang]),
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, Android, iOS",
        inLanguage: t.meta.inLanguage,
        description: t.meta.description,
        areaServed: { "@type": "City", name: `${CITY.name}, ${CITY.uf}` },
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
      {
        "@type": "VideoObject",
        name: t.video.label,
        description: t.video.ldDescription,
        thumbnailUrl: [`${SITE}/video/viu-explicativo-16x9.jpg`, `${SITE}/video/viu-explicativo-9x16.jpg`],
        uploadDate: "2026-10-07T23:30:00-03:00",
        duration: "PT59S",
        contentUrl: `${SITE}/video/viu-explicativo-16x9.mp4`,
        inLanguage: "pt-BR",
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

// App instalado aberto num atalho antigo da raiz: vai ao mapa antes de pintar
const standaloneScript = `if(matchMedia("(display-mode: standalone)").matches||navigator.standalone)location.replace("/mapa")`;


function Arrow() {
  return (
    <svg className="lp-seta" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function Check({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.2" strokeLinecap="round" className="mt-0.5 flex-none" aria-hidden="true">
      <path className={className} style={style} d="M5 12l5 5L20 7" />
    </svg>
  );
}

function SectionHead({ eyebrow, id, children, accent }: { eyebrow: string; id: string; children: ReactNode; accent?: boolean }) {
  return (
    <div className="lp-rv flex max-w-[640px] flex-col gap-2.5">
      <span className={`lp-pilula ${accent ? "lp-pilula-luz" : ""}`}>{eyebrow}</span>
      <h2 id={id} className="lp-disp lp-h2">{children}</h2>
    </div>
  );
}

// Uma palavra do título. Já teve uma versão dourada: a palavra em destaque no
// meio da manchete era um dos tiques do visual antigo, e saiu no redesign.
function Word({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="lp-w" style={{ animationDelay: `${delay}s` }}>
      {children}
    </span>
  );
}

export default function Landing({ lang }: { lang: Lang }) {
  const t = DICT[lang];
  return (
    <>
    {/* scripts fora do LangProvider (componente de cliente): dentro dele o
        React reclama de <script> renderizado no cliente */}
    <script dangerouslySetInnerHTML={{ __html: standaloneScript }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(lang)) }} />
    <LangProvider lang={lang}>
    <div className="dark lp min-h-screen">
      <CeuDoDia />
      <VooOlheiro cor={NIVEL_COR[3]} tam={76} />
      <Reveal />

      <Cabecalho />

      <main>
        {/* Hero: a cidade à noite, com as peças do app flutuando no céu */}
        <section id="topo" aria-labelledby="h1" className="lp-ceu" data-hora="21">
          <div className="lp-wrap relative z-[1] flex flex-wrap items-center gap-12 pb-28 pt-[124px]">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
              <span className="lp-pilula lp-fade self-start">
                <span className="lp-ponto" style={{ background: "var(--luz)" }} />
                {CITY.name}, {CITY.uf} · beta
              </span>
              <h1 id="h1" className="lp-disp lp-h1 m-0">
                {t.hero.line1.map((w, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <Word delay={i ? 0.2 : 0.05}>{w}</Word>
                  </Fragment>
                ))}
                <br />
                {t.hero.line2.map((w, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <Word delay={0.4 + i * 0.08}>{w}</Word>
                  </Fragment>
                ))}
              </h1>
              <p className="lp-fade lp-muted m-0 max-w-[520px] text-lg" style={{ animationDelay: "0.6s" }}>
                {t.hero.lead}
              </p>
              <div className="lp-fade flex flex-wrap gap-3" style={{ animationDelay: "0.75s" }}>
                <a href="/mapa" className="lp-btn lp-btn-p" style={{ minHeight: 52, padding: "0 26px", fontSize: 16 }}>
                  {t.hero.cta}
                  <Arrow />
                </a>
                <VideoLink className="lp-btn lp-btn-s" style={{ minHeight: 52, padding: "0 22px", fontSize: 16 }}>
                  <PlayIcon />
                  {t.hero.video}
                </VideoLink>
              </div>
            </div>
            <div className="min-w-0 flex-[1_1_480px]">
              <HeroNoite />
            </div>
          </div>
          <Horizonte />
          <div className="lp-ceu-telhado">
            <OlheiroVivo cor={NIVEL_COR[0]} tam={58} falas={t.olheiros.falas} />
            <span className="lp-ninho" data-ninho aria-hidden="true">
              <Olheiro cor={NIVEL_COR[3]} tam={76} />
            </span>
            <OlheiroVivo cor={NIVEL_COR[2]} tam={62} falas={t.olheiros.falas} sozinho={false} />
          </div>
        </section>

        {/* Problema */}
        <section aria-labelledby="h-prob" data-hora="5.5">
          <div className="lp-wrap lp-sec flex flex-col gap-9">
            <SectionHead eyebrow={t.problem.eyebrow} id="h-prob">{t.problem.title}</SectionHead>
            <div className="lp-grid lp-rvg">
              {t.problem.cards.map(([h, p], i) => (
                <div key={h} className="light lp-card lp-tilt">
                  {i === 0 && (
                    <span className="lp-pouso" data-pouso>
                      <OlheiroVivo cor={NIVEL_COR[3]} tam={50} falas={t.olheiros.problema} />
                    </span>
                  )}
                  <span className="lp-num text-[28px] font-medium" style={{ color: "var(--danger)" }}>0{i + 1}</span>
                  <h3 className="lp-disp mb-1.5 mt-2.5 text-[21px]">{h}</h3>
                  <p className="lp-muted m-0">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Post que some */}
        <FadingPost />

        {/* Faixa */}
        <div className="lp-faixa lp-alt" aria-hidden="true">
          <div className="lp-trilho">
            {[...t.ticker, ...t.ticker].map((x, i) => (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: TICKER_COLOR[i % TICKER_COLOR.length] }} />
                <strong className="font-semibold">{x.cat}</strong>
                <span className="lp-muted">{x.onde}</span>
                <span className="lp-num lp-muted text-xs">{x.ha}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Vídeo de 1 minuto: começa no "ouvi dizer", responde o problema antes do detalhe */}
        <section id="video" aria-labelledby="h-video" data-hora="8" className="lp-wrap lp-sec flex flex-col gap-9">
          <SectionHead eyebrow={t.video.eyebrow} id="h-video">{t.video.title}</SectionHead>
          <div className="lp-rv">
            <ExplainerVideo />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como" aria-labelledby="h-como" data-hora="9" className="lp-wrap lp-sec flex flex-col gap-9">
          <SectionHead eyebrow={t.how.eyebrow} id="h-como">{t.how.title}</SectionHead>
          <ol className="lp-grid lp-rvg m-0 list-none p-0">
            <li className="light lp-card lp-tilt flex flex-col gap-3">
              <div className="flex items-center justify-between"><span className="lp-num text-sm" style={{ color: "var(--accent)" }}>01</span><span className="lp-legenda">{t.how.steps[0].tag}</span></div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <g className="lp-obt"><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></g>
                <circle className="lp-flash" cx="12" cy="13" r="10" fill="var(--ink)" stroke="none" />
              </svg>
              <h3 className="lp-disp m-0 text-[22px]">{t.how.steps[0].h}</h3>
              <p className="lp-muted m-0">{t.how.steps[0].p}</p>
            </li>
            <li className="light lp-card lp-tilt relative flex flex-col gap-3">
              <OlheiroVivo cor={NIVEL_COR[1]} tam={38} falas={t.olheiros.como} className="lp-poleiro" />
              <div className="flex items-center justify-between"><span className="lp-num text-sm" style={{ color: "var(--accent)" }}>02</span><span className="lp-legenda">{t.how.steps[1].tag}</span></div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path className="lp-check" d="M8 12l3 3 5-6" />
              </svg>
              <h3 className="lp-disp m-0 text-[22px]">{t.how.steps[1].h}</h3>
              <p className="lp-muted m-0">{t.how.steps[1].p}</p>
            </li>
            <li className="light lp-card lp-tilt flex flex-col gap-3">
              <div className="flex items-center justify-between"><span className="lp-num text-sm" style={{ color: "var(--accent)" }}>03</span><span className="lp-legenda">{t.how.steps[2].tag}</span></div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle className="lp-relogio" cx="12" cy="12" r="9" transform="rotate(-90 12 12)" />
                <path className="lp-ponteiro" d="M12 12V6" />
              </svg>
              <h3 className="lp-disp m-0 text-[22px]">{t.how.steps[2].h}</h3>
              <p className="lp-muted m-0">{t.how.steps[2].p}</p>
            </li>
          </ol>
        </section>

        {/* Um dia na cidade */}
        <section aria-labelledby="h-dia" data-hora="10">
          <div className="lp-wrap lp-sec flex flex-col gap-9">
            <SectionHead eyebrow={t.dayHead.eyebrow} id="h-dia">{t.dayHead.title}</SectionHead>
            <div className="light lp-painel lp-rv">
              <DaySection />
            </div>
          </div>
        </section>

        {/* Story */}
        <section aria-labelledby="h-story" data-hora="12" className="lp-alt">
          <div className="lp-wrap lp-sec flex flex-wrap items-center gap-12">
            <div className="lp-rv flex min-w-0 flex-[1_1_380px] flex-col gap-5">
              <span className="lp-legenda">{t.story.eyebrow}</span>
              <h2 id="h-story" className="lp-disp lp-h2">{t.story.title}</h2>
              <p className="lp-muted m-0 text-[17px]">
                {t.story.lead}
              </p>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {t.story.bullets.map((b, i) => (
                  <li key={b} className="flex gap-2.5">
                    <Check className="lp-check" style={{ animationDelay: `${i * 0.3}s` }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-rv flex min-w-0 flex-[1_1_300px] justify-center">
              <StoryDemo />
            </div>
          </div>
        </section>

        {/* Alertas */}
        <section aria-labelledby="h-alerta" data-hora="13" className="lp-wrap lp-sec flex flex-wrap items-center gap-12">
          <div className="lp-rv flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            <span className="lp-legenda">{t.alerts.eyebrow}</span>
            <h2 id="h-alerta" className="lp-disp lp-h2">{t.alerts.title}</h2>
            <p className="lp-muted m-0 text-[17px]">
              {t.alerts.lead}
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {t.alerts.bullets.map((b, i) => (
                <li key={b} className="flex gap-2.5">
                  <Check className="lp-check" style={{ animationDelay: `${i * 0.3}s` }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-rv min-w-0 flex-[1_1_360px]">
            <LazyScene kind="alert" style={{ minHeight: 580 }} />
          </div>
        </section>

        {/* Recursos */}
        <section aria-labelledby="h-rec" data-hora="14">
          <div className="lp-wrap lp-sec flex flex-col gap-9">
            <SectionHead eyebrow={t.features.eyebrow} id="h-rec">{t.features.title}</SectionHead>
            <div className="lp-grid lp-rvg">
              {t.features.items.map(([h, p], i) => (
                <div key={h} className={`light lp-card lp-tilt ${i === 0 ? "lp-viva" : ""}`}>
                  <h3 className="lp-disp mb-2 mt-0 text-xl" style={{ color: "var(--accent)" }}>{h}</h3>
                  <p className="lp-muted m-0">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rostos e placas */}
        <section aria-labelledby="h-borra" data-hora="15" className="lp-wrap lp-sec flex flex-wrap items-center gap-12">
          <div className="lp-rv min-w-0 flex-[1_1_480px] overflow-hidden rounded-[22px] border border-line" style={{ aspectRatio: "11 / 9" }}>
            <LazyScene kind="blur" className="h-full w-full" title={t.blur.scene} />
          </div>
          <div className="lp-rv flex min-w-0 flex-[1_1_360px] flex-col gap-5">
            <span className="lp-legenda">{t.blur.eyebrow}</span>
            <h2 id="h-borra" className="lp-disp lp-h2">{t.blur.title}</h2>
            <p className="lp-muted m-0 text-[17px]">
              {t.blur.lead}
            </p>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {t.blur.steps.map(([h, p], i) => (
                <li key={h} className="flex items-baseline gap-3">
                  <span className="lp-num text-sm" style={{ color: "var(--accent)" }}>0{i + 1}</span>
                  <span>
                    <strong className="font-semibold">{h}</strong> <span className="lp-muted">{p}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Confiança e gamificação */}
        <section aria-label={t.trust.label} data-hora="16" className="lp-alt">
          <div className="lp-wrap lp-sec lp-rvg flex flex-wrap gap-6">
            <div className="light lp-card flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <span className="lp-legenda">{t.trust.eyebrow}</span>
              <h2 className="lp-disp m-0 text-[32px] leading-[1.1]">{t.trust.title}</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {t.trust.items.map((b, i) => (
                  <li key={b} className="flex gap-2.5">
                    <Check className="lp-check" style={{ animationDelay: `${i * 0.3}s` }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="light lp-card flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <span className="lp-legenda">{t.game.eyebrow}</span>
              <h2 className="lp-disp m-0 text-[32px] leading-[1.1]">{t.game.title(t.levels[0], t.levels[5])}</h2>
              <p className="lp-muted m-0">{t.game.lead}</p>
              <AchievementShowcase />
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="lp-legenda" style={{ color: "var(--ink)" }}>{t.game.level(2, t.levels[1])}</span>
                  <span className="lp-num lp-muted text-xs">340 / 400 XP</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--elev)" }}>
                  <div className="lp-bar h-full rounded-full" style={{ width: "85%", background: "var(--accent)" }} />
                </div>
                <span className="lp-muted text-xs">{t.game.left(60, t.levels[2])}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Primeiro do bairro */}
        <section id="bairro" aria-labelledby="h-bairro" data-hora="17" className="lp-wrap lp-sec flex flex-col gap-9">
          <SectionHead eyebrow={t.hood.eyebrow} id="h-bairro" accent>
            {t.hood.title}
          </SectionHead>
          <p className="lp-muted lp-rv m-0 -mt-4 max-w-[640px] text-[17px]">
            {t.hood.lead}
          </p>
          <div className="light lp-painel lp-rv">
            <FirstInNeighborhood />
          </div>
        </section>

        {/* Comércios */}
        <section id="comercios" aria-labelledby="h-com" data-hora="17.75" className="lp-wrap lp-sec flex flex-wrap items-start gap-12">
          <div className="lp-rv flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
            <span className="lp-legenda">{t.shops.eyebrow}</span>
            <h2 id="h-com" className="lp-disp lp-h2">{t.shops.title}</h2>
            <p className="lp-muted m-0 text-[17px]">
              {t.shops.leadA} <strong className="text-ink">{t.shops.badge}</strong> {t.shops.leadB}
            </p>
            <span className="lp-selo self-start rounded-full px-3.5 py-1.5 text-sm font-semibold" style={{ border: "1px solid var(--ok)", color: "var(--ok)" }}>
              {t.shops.free}
            </span>
          </div>
          <div className="light lp-card lp-rv relative flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <OlheiroVivo cor={NIVEL_COR[0]} tam={40} falas={t.olheiros.comercio} className="lp-poleiro" />
            <span className="lp-legenda">{t.shops.simulate}</span>
            <AdSimulator />
            <ol className="lp-muted m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
              <li className="flex gap-2.5"><span className="lp-num" style={{ color: "var(--accent)" }}>1</span>{t.shops.steps[0]}</li>
              <li className="flex gap-2.5"><span className="lp-num" style={{ color: "var(--accent)" }}>2</span>{t.shops.steps[1]}</li>
              <li className="flex gap-2.5"><span className="lp-num" style={{ color: "var(--accent)" }}>3</span>{t.shops.steps[2]}</li>
            </ol>
            <a href="/mapa?comercio" className="lp-btn lp-btn-p w-full">
              {t.shops.cta}
              <Arrow />
            </a>
          </div>
        </section>

        {/* Outras cidades */}
        <section aria-labelledby="h-cid" data-hora="18.25" className="lp-alt">
          <div className="lp-wrap lp-rv flex flex-wrap items-center justify-between gap-5 py-14">
            <div className="flex flex-[1_1_360px] flex-col gap-1.5">
              <h2 id="h-cid" className="lp-disp m-0 text-[28px]">{t.cities.title}</h2>
              <p className="lp-muted m-0">{t.cities.lead}</p>
            </div>
            <a href="/mapa" className="lp-btn lp-btn-s">
              {t.cities.cta}
              <Arrow />
            </a>
          </div>
        </section>

        {/* Perguntas */}
        <section id="faq" aria-labelledby="h-faq" data-hora="19" className="lp-sec mx-auto flex max-w-[820px] flex-col gap-6 px-5">
          <h2 id="h-faq" className="lp-disp lp-h2 lp-rv">{t.faqTitle}</h2>
          <div className="light lp-painel lp-faq relative">
            <OlheiroVivo cor={NIVEL_COR[4]} tam={40} falas={t.olheiros.faq} className="lp-poleiro" />
            <div className="lp-rvg flex flex-col">
            {t.faq.map((f) => (
              <details key={f.q} className="border-b border-line">
                <summary>
                  <h3 className="m-0 [font:inherit]">{f.q}</h3>
                  <span className="lp-plus" aria-hidden="true">+</span>
                </summary>
                <p className="lp-muted mb-5 mt-0">{f.a}</p>
              </details>
            ))}
            </div>
          </div>
        </section>

        {/* CTA final: a noite volta, com todos os níveis de Olheiro */}
        <section aria-labelledby="h-cta" className="lp-ceu lp-fim" data-hora="21">
          <div className="lp-wrap lp-rv relative z-[1] flex flex-col items-center gap-[26px] pb-44 pt-28 text-center">
            <h2 id="h-cta" className="lp-disp lp-h1 m-0 max-w-[880px]">
              {t.end.title} <span style={{ color: "var(--luz)" }}>{t.end.gold}</span>
            </h2>
            <a href="/mapa" className="lp-btn lp-btn-p" style={{ minHeight: 56, padding: "0 32px", fontSize: 17 }}>
              {t.end.cta}
              <Arrow />
            </a>
            <ul className="m-0 mt-8 flex list-none flex-wrap items-end justify-center gap-x-6 gap-y-5 p-0" aria-label={t.game.eyebrow}>
              {t.levels.map((nome, i) => (
                <li key={nome} className="flex flex-col items-center gap-2">
                  <OlheiroVivo cor={NIVEL_COR[i]} tam={44 + i * 8} falas={[nome]} sozinho={false} lado={i < 3 ? "dir" : "esq"} />
                  <span className="text-xs font-semibold">{nome}</span>
                </li>
              ))}
            </ul>
          </div>
          <Horizonte />
        </section>
      </main>

      <footer className="dark" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="lp-wrap lp-muted flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6 text-[13px]">
          <span className="lp-disp text-base text-ink">Viu na Cidade · {CITY.name}/{CITY.uf}</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="/termos" className="underline-offset-4 hover:underline">{t.foot.terms}</a>
            <a href="/privacidade" className="underline-offset-4 hover:underline">{t.foot.privacy}</a>
            <PauseButton />
          </div>
        </div>
      </footer>
    </div>
    </LangProvider>
    </>
  );
}
