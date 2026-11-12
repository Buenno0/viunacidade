"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { severityVar } from "@/lib/categories";
import Mark from "@/components/ui/Mark";
import { BellIcon, CategoryIcon } from "@/components/ui/icons";
import Olheiro, { NIVEL_COR } from "./Olheiro";
import OlheiroVivo from "./OlheiroVivo";
import { useT } from "./lang";
import { lpPaused, reducedMotion } from "./time";

// O herói da direção "Noite": as peças de verdade do app flutuando sobre o céu,
// chegando como numa conversa (referência: agentes.chat). No alto, a pílula do
// topo do app (P2), com o pulso da cidade trocando a cada ~9 s; o post aparece
// depois de "alguém está postando", com o cabeçalho do story do app; por fim
// vem a pergunta "Ainda está rolando?", que funciona: quem visita vota e vê a
// resposta. Embaixo, o nível como no botão da conta: o Olheiro com o anel de
// XP. Nada sai daqui; é só a demonstração.
const CICLO_MS = 9000;
const DIGITA_MS = 1300;

export default function HeroNoite() {
  const t = useT().heroCards;
  const o = useT().olheiros;
  const [voto, setVoto] = useState<"sim" | "nao" | null>(null);
  const [aviso, setAviso] = useState(0);
  const [digitando, setDigitando] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const confirmaram = 3 + (voto === "sim" ? 1 : 0);

  useEffect(() => {
    const calmo = reducedMotion();
    const d = setTimeout(() => setDigitando(false), calmo ? 0 : 500 + DIGITA_MS);
    if (calmo) return () => clearTimeout(d);
    const el = ref.current;
    let visivel = true;
    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting));
    if (el) io.observe(el);
    const i = setInterval(() => {
      if (visivel && !lpPaused()) setAviso((n) => (n + 1) % t.pulse.length);
    }, CICLO_MS);
    return () => (clearTimeout(d), clearInterval(i), io.disconnect());
  }, [t.pulse.length]);

  const [cat, titulo, linha] = t.pulse[aviso];

  return (
    <div ref={ref} className="lp-ceu-cards" role="group" aria-label={t.label}>
      <div className="lp-flutua lp-ceu-aviso-casca" style={{ "--d": "0s" } as CSSProperties}>
        <div className="lp-ceu-pilula">
          <Mark size={28} className="shrink-0" />
          <span className="lp-ceu-pilula-viu">viu</span>
          <span className="h-7 w-px shrink-0 bg-white/20" aria-hidden="true" />
          <div key={aviso} className="lp-ceu-pulso" aria-live="polite">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px]"
              style={{ borderColor: severityVar(cat), color: severityVar(cat), background: `color-mix(in oklab, ${severityVar(cat)} 18%, transparent)` }}
              aria-hidden="true"
            >
              <CategoryIcon category={cat} width="17" height="17" />
            </span>
            <span className="flex min-w-0 flex-col gap-[3px] leading-none">
              <strong className="truncate text-[15px]">{titulo}</strong>
              <span className="truncate text-xs font-bold text-[var(--luz)]">{linha}</span>
            </span>
          </div>
          <span className="lp-ceu-pilula-sino" aria-label={t.alerts} role="img">
            <BellIcon width="18" height="18" />
          </span>
          <span className="lp-ceu-pilula-conta" aria-label={t.account} role="img">
            <Olheiro nivel={1} tam={16} className="mt-0.5" />
          </span>
        </div>
      </div>

      <article className="lp-flutua lp-ceu-post lp-tilt" style={{ "--d": "0.5s" } as CSSProperties}>
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <span
            className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-[#c62a2a] bg-[#c62a2a]/10 text-[#c62a2a]"
            aria-hidden="true"
          >
            <CategoryIcon category="alagamento" width="14" height="14" />
          </span>
          {t.category}
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#c62a2a]">
            <span className="lp-ponto lp-ponto-eco" />
            {t.now}
          </span>
        </div>
        {digitando ? (
          <div className="lp-digitando" aria-label={t.typing}>
            <span className="lp-ceu-avatar" aria-hidden="true">?</span>
            <span className="lp-pontinhos" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="text-xs text-[#8a93ad]">{t.typing}</span>
          </div>
        ) : (
          <div className="lp-msg-entra flex flex-col gap-3">
            <img src="/landing/alagamento.svg" alt={t.photo} width={480} height={260} className="lp-ceu-foto" />
            <div className="flex items-start gap-2.5">
              <span className="lp-ceu-avatar" aria-hidden="true">
                <Olheiro nivel={1} tam={18} className="mt-1" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-bold">
                  {t.anon} <span className="font-medium text-[#5b6480]">· {t.near}</span>
                </span>
                <span className="text-sm leading-snug">{t.text}</span>
              </div>
            </div>
            <div className="lp-ceu-pergunta lp-msg-entra" style={{ animationDelay: "0.35s" }}>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-[#5b6480]">
                <strong className="text-[#0a1230]">{t.ask}</strong>
                <span className="lp-num">
                  {t.count(confirmaram)} · {t.ago}
                </span>
              </div>
              {voto ? null : (
                <div className="flex gap-2">
                  <button type="button" className="lp-ceu-sim" onClick={() => setVoto("sim")}>
                    ✓ {t.yes}
                  </button>
                  <button type="button" className="lp-ceu-nao" onClick={() => setVoto("nao")}>
                    {t.no}
                  </button>
                </div>
              )}
              <p aria-live="polite" className="m-0 text-[13px] font-semibold text-[#0e7a5c]">
                {voto === "sim" ? t.thanks : voto === "nao" ? t.thanksNo : ""}
              </p>
              {voto ? null : <span className="lp-ceu-tenta">{t.try}</span>}
            </div>
          </div>
        )}
        <OlheiroVivo cor={NIVEL_COR[1]} tam={44} falas={o.falas} className="lp-ceu-espia" lado="esq" />
      </article>

      <div className="lp-flutua lp-ceu-nivel lp-tilt" style={{ "--d": "1s" } as CSSProperties}>
        {/* o nível como no botão da conta do app: o Olheiro com o anel de XP */}
        <span className="relative grid h-12 w-12 shrink-0 place-items-center" aria-hidden="true">
          <svg viewBox="0 0 48 48" className="absolute inset-0">
            <circle cx="24" cy="24" r="24" fill="#ffd27a" />
            <circle cx="24" cy="24" r="21" fill="none" stroke="#0a1230" strokeOpacity="0.15" strokeWidth="3.5" />
            <circle className="lp-xp-anel" cx="24" cy="24" r="21" fill="none" stroke="#0a1230" strokeWidth="3.5" pathLength={100} strokeDasharray="85 100" strokeLinecap="round" transform="rotate(-90 24 24)" />
          </svg>
          <Olheiro nivel={1} tam={19} className="relative mt-0.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <strong className="text-[13px]">{t.level}</strong>
            <span className="lp-num text-[11px] text-[#5b6480]">340/400</span>
          </span>
          <span className="text-xs text-[#5b6480]">{t.left}</span>
        </div>
      </div>
    </div>
  );
}
