"use client";

import { useEffect, useRef } from "react";
import Mark from "@/components/ui/Mark";
import { useT } from "./lang";

// O cabeçalho da LP faz parte da página: no topo é transparente sobre o céu,
// alinhado à mesma grade do conteúdo. Depois do herói vira uma barra de vidro
// de ponta a ponta, tingida pela cor do alto do céu (o CeuDoDia escreve
// --vidro). Some ao descer e volta ao subir. Embaixo, uma linha pontilhada
// mostra quanto da página já foi lido. O relógio é a hora do céu, o mesmo
// "relógio de missão" do app.
export default function Cabecalho() {
  const t = useT().head;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ultimoY = window.scrollY;
    let raf = 0;
    const pinta = () => {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      el.style.setProperty("--lido", (y / max).toFixed(4));
      el.classList.toggle("is-compacta", y > 220);
      // some descendo (depois do herói), volta subindo; perto do topo, sempre
      if (y < 220 || y < ultimoY - 4) el.classList.remove("is-escondida");
      else if (y > ultimoY + 6) el.classList.add("is-escondida");
      ultimoY = y;
    };
    const pede = () => {
      if (!raf) raf = requestAnimationFrame(pinta);
    };
    // quem navega pelo teclado precisa ver o cabeçalho
    const foco = () => el.classList.remove("is-escondida");
    window.addEventListener("scroll", pede, { passive: true });
    el.addEventListener("focusin", foco);
    pede();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pede);
      el.removeEventListener("focusin", foco);
    };
  }, []);

  return (
    <header ref={ref} className="dark lp-pilula-topo">
      <div className="lp-pilula-barra">
        <a href="#topo" aria-label={t.home} className="lp-disp flex items-center gap-2 text-[21px] font-medium">
          <Mark size={34} />
          <span className="lp-pilula-nome">viu</span>
        </a>
        <nav aria-label={t.nav} className="lp-pilula-nav hidden md:flex">
          <a href="#como">{t.how}</a>
          <a href="#comercios">{t.shops}</a>
          <a href="#faq">{t.faq}</a>
        </nav>
        <span className="lp-relogio-ceu" data-relogio data-periodo="noite" title={t.skyClock}>
          <span className="lp-relogio-astro" aria-hidden="true" />
          <span className="lp-num" data-hora-texto>
            21:00
          </span>
        </span>
        <a href={t.switchHref} hrefLang={t.switchLang} lang={t.switchLang} aria-label={t.switchLabel} title={t.switchLabel} className="lp-pilula-link lp-num">
          {t.switchShort}
        </a>
        <a href="/mapa?entrar" className="lp-pilula-link hidden sm:inline-flex">
          {t.signIn}
        </a>
        <a href="/mapa" className="lp-btn lp-btn-p lp-pilula-cta">
          {t.openMap}
        </a>
      </div>
      <span className="lp-pilula-lido" aria-hidden="true" />
    </header>
  );
}
