"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import OlheiroVivo from "./OlheiroVivo";
import { NIVEL_COR } from "./Olheiro";
import { useT } from "./lang";
import { lpPaused, reducedMotion } from "./time";

// O herói da direção "Noite": as peças de verdade do app flutuando sobre o céu,
// chegando como numa conversa (referência: agentes.chat). O aviso cai do alto
// e troca a cada ~9 s; o post aparece depois de "alguém está postando"; por
// fim vem a pergunta "Ainda está rolando?", que funciona: quem visita vota e
// vê a resposta. Nada sai daqui; é só a demonstração.
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
      if (visivel && !lpPaused()) setAviso((n) => (n + 1) % t.alerts.length);
    }, CICLO_MS);
    return () => (clearTimeout(d), clearInterval(i), io.disconnect());
  }, [t.alerts.length]);

  const [titulo, onde] = t.alerts[aviso];

  return (
    <div ref={ref} className="lp-ceu-cards" role="group" aria-label={t.label}>
      <div className="lp-flutua lp-ceu-aviso-casca" style={{ "--d": "0s" } as CSSProperties}>
        <div key={aviso} className="lp-ceu-aviso lp-tilt" aria-live="polite">
          <span className="lp-ceu-icone" aria-hidden="true">!</span>
          <div className="flex min-w-0 flex-col">
            <strong className="text-[13px]">{titulo}</strong>
            <span className="text-xs text-[#5b6480]">{onde}</span>
          </div>
        </div>
      </div>

      <article className="lp-flutua lp-ceu-post lp-tilt" style={{ "--d": "0.5s" } as CSSProperties}>
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <span className="text-[#8a93ad]">#</span>
          {t.channel}
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
              <span className="lp-ceu-avatar" aria-hidden="true">?</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-bold">
                  {t.anon} <span className="font-medium text-[#8a93ad]">21:02</span>
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
        <div className="flex justify-between gap-3 text-xs">
          <strong>{t.level}</strong>
          <span className="lp-num text-[#5b6480]">340/400</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e9edf8]">
          <div className="lp-xp-enche h-full rounded-full bg-[#2f56b8]" style={{ width: "85%" }} />
        </div>
        <span className="text-xs text-[#5b6480]">{t.left}</span>
      </div>
    </div>
  );
}
