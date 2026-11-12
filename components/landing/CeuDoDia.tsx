"use client";

import { useEffect, useRef } from "react";
import { ceu } from "@/design/tokens.mjs";
import { fmt, lerpStops, put, smooth, type Stop } from "./time";

// O céu da LP: uma camada fixa atrás da página que passa por um dia inteiro
// conforme a pessoa rola (referência: agentes.chat). A hora não sai da
// porcentagem da página, e sim das âncoras: cada seção tem data-hora, e a
// hora é a interpolação entre as âncoras em volta do meio da tela. Assim o
// amanhecer cai no problema e o pôr do sol nos comércios, no desktop e no
// celular.
//
// Um quadro por rolagem (listener passivo + flag), e as variáveis vão só na
// camada do céu, no cabeçalho e no horizonte, nunca no <html>: variável
// herdada mudando por quadro recalcula a página inteira (ver DaySection).

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const CEU: Stop[] = (ceu as [number, string[]][]).map(([h, faixas]) => [h, faixas.flatMap(rgb)]);

type Ancora = { y: number; h: number };

// as âncoras, com a hora "desenrolada" (21h → 5h30 vira 21 → 29,5)
function lerAncoras(): Ancora[] {
  const els = [...document.querySelectorAll<HTMLElement>("[data-hora]")];
  const out: Ancora[] = [];
  let antes = -Infinity;
  for (const el of els) {
    let h = Number(el.dataset.hora);
    while (h < antes) h += 24;
    antes = h;
    // a âncora é o meio da seção: a hora dela vale quando ela está no meio da tela
    const r = el.getBoundingClientRect();
    out.push({ y: r.top + window.scrollY + r.height / 2, h });
  }
  return out;
}

function horaEm(ancoras: Ancora[], y: number) {
  if (!ancoras.length) return 21;
  if (y <= ancoras[0].y) return ancoras[0].h;
  for (let i = 1; i < ancoras.length; i++) {
    const a = ancoras[i - 1], b = ancoras[i];
    if (y < b.y) return a.h + ((y - a.y) / Math.max(1, b.y - a.y)) * (b.h - a.h);
  }
  return ancoras[ancoras.length - 1].h;
}

// O arco do sol e da lua fica achatado na faixa de cima da tela (de 7% a 15%
// da altura): é por onde o texto menos passa, e o astro não briga com título.
const arco = (x: number): [number, number] => {
  const t = Math.min(1, Math.max(0, x));
  return [6 + 88 * t, 15 - Math.sin(Math.PI * t) * 8];
};

// quanto é noite (0 de dia, 1 de noite)
const noiteEm = (h: number) => Math.max(1 - smooth(5, 6.6, h), smooth(18.4, 19.8, h));
// o brilho quente: forte no amanhecer e no pôr do sol
const quenteEm = (h: number) => Math.max(smooth(4.8, 5.6, h) * (1 - smooth(6.2, 7.6, h)), smooth(16.4, 17.8, h) * (1 - smooth(18.6, 19.6, h)));

export default function CeuDoDia() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ceuEl = ref.current;
    if (!ceuEl) return;
    const q = <T extends HTMLElement>(s: string) => ceuEl.querySelector<T>(s);
    const estrelasA = q(".lp-ceu-estrelas-a"), estrelasB = q(".lp-ceu-estrelas-b");
    const nuvens = q(".lp-ceu-nuvens"), quente = q(".lp-ceu-quente");
    const sol = q(".lp-ceu-sol"), lua = q(".lp-ceu-lua");
    const cabecalho = document.querySelector<HTMLElement>(".lp-pilula-topo");
    const relogio = document.querySelector<HTMLElement>("[data-relogio]");
    let janelas = [...document.querySelectorAll<HTMLElement>(".lp-horizonte-janelas")];

    let ancoras = lerAncoras();
    let sujo = true;
    let raf = 0;
    let ultimoMinuto = "";

    const pinta = () => {
      raf = 0;
      if (!sujo) return;
      sujo = false;
      const total = horaEm(ancoras, window.scrollY + window.innerHeight * 0.5);
      const h = ((total % 24) + 24) % 24;

      const c = lerpStops(CEU, h).map((v) => v | 0);
      for (let i = 0; i < 4; i++) put(ceuEl, `--c${i}`, `rgb(${c[i * 3]} ${c[i * 3 + 1]} ${c[i * 3 + 2]})`);

      const noite = noiteEm(h);
      put(estrelasA, "opacity", noite.toFixed(3));
      put(estrelasB, "opacity", noite.toFixed(3));
      // translúcidas: elas passam atrás de títulos brancos
      put(nuvens, "opacity", ((1 - noite) * 0.38).toFixed(3));
      put(quente, "opacity", quenteEm(h).toFixed(3));
      for (const j of janelas) put(j, "opacity", (0.12 + noite * 0.88).toFixed(3));

      // o sol nasce às 6h e se põe às 18h30; a lua vai das 18h30 às 6h
      const [sx, sy] = arco((h - 6) / 12.5);
      put(sol, "left", `${sx}%`);
      put(sol, "top", `${sy}%`);
      put(sol, "opacity", (smooth(5.3, 6.2, h) * (1 - smooth(18, 18.9, h))).toFixed(3));
      const hl = h < 12 ? h + 24 : h;
      // a lua anda ao contrário do sol: às 21h ela está à direita, longe do texto
      const [lx, ly] = arco(1 - (hl - 18.5) / 11.5);
      put(lua, "left", `${lx}%`);
      put(lua, "top", `${ly}%`);
      put(lua, "opacity", noite.toFixed(3));

      // o cabeçalho é vidro tingido pela cor do alto do céu
      put(cabecalho, "--vidro", `rgb(${c[0]} ${c[1]} ${c[2]} / 0.72)`);
      const minuto = fmt(h);
      if (relogio && minuto !== ultimoMinuto) {
        ultimoMinuto = minuto;
        const t = relogio.querySelector("[data-hora-texto]");
        if (t) t.textContent = minuto;
        relogio.dataset.periodo = noite > 0.5 ? "noite" : "dia";
      }
    };
    const pede = () => {
      sujo = true;
      if (!raf) raf = requestAnimationFrame(pinta);
    };
    const remede = () => {
      ancoras = lerAncoras();
      janelas = [...document.querySelectorAll<HTMLElement>(".lp-horizonte-janelas")];
      pede();
    };

    // o conteúdo muda de altura (cenas que montam perto da tela, vídeo): as
    // âncoras são medidas de novo quando a página cresce ou encolhe
    const ro = new ResizeObserver(remede);
    ro.observe(document.body);
    window.addEventListener("scroll", pede, { passive: true });
    window.addEventListener("resize", remede);
    pede();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", pede);
      window.removeEventListener("resize", remede);
    };
  }, []);

  return (
    <div ref={ref} className="lp-ceu-fixo" aria-hidden="true">
      <div className="lp-ceu-quente" />
      <div className="lp-ceu-estrelas lp-ceu-estrelas-a" />
      <div className="lp-ceu-estrelas lp-ceu-estrelas-b" />
      <div className="lp-ceu-nuvens" />
      <div className="lp-ceu-lua" />
      <div className="lp-ceu-sol" />
    </div>
  );
}

// O horizonte da cidade (no herói e no fim): a silhueta e, por cima, as
// janelas, que o céu acende à noite.
export function Horizonte({ className = "" }: { className?: string }) {
  return (
    <div className={`lp-horizonte ${className}`} aria-hidden="true">
      <img src="/landing/horizonte-silhueta.svg" alt="" width={2400} height={320} />
      <img src="/landing/horizonte-janelas.svg" alt="" width={2400} height={320} className="lp-horizonte-janelas" />
    </div>
  );
}
