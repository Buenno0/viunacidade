import type { CSSProperties } from "react";

// O Olheiro (direção A, "Janela acesa", escolhida em 11/11/2026): cada
// Olheiro é um prédio da cidade, e os olhos são as janelas acesas. Quem sobe
// de nível vira construção maior: casinha (Curioso), sobrado com antena
// (Olheiro), prédio com caixa d'água (Vigia), torre do relógio às 21h
// (Sentinela), igreja com sino (Guardião) e, na Lenda, a coroa de luzes com a
// faixa de azulejo. Desenho em canvas.json do Claude Design "Viu: Olheiros e
// logo".
//
// SVG puro, sem id de gradiente ou filtro: o mesmo desenho roda no servidor
// e no cliente, e vários na mesma página não brigam por id. O piscar (as
// janelas) e o olhar em volta (as pupilas) são CSS em app/landing.css.
export const NIVEL_COR = ["#f08f6f", "#5fd3b8", "#79bcff", "#a597ff", "#ff7cb8", "#2f56b8"];

// a cor de cada telhado, um tom abaixo do corpo
const TELHADO = ["#b8503a", "#2e8a74", "#4b8fd8", "#7d6fe0", "#d65f97", "#2f56b8"];

function Telhado({ n }: { n: number }) {
  const t = TELHADO[n];
  if (n === 0)
    return (
      <>
        <rect x="70" y="22" width="9" height="20" fill="#9a4130" />
        <path d="M4 56 L50 16 L96 56 Z" fill={t} stroke="#0a1230" strokeOpacity="0.2" strokeWidth="3" strokeLinejoin="round" />
      </>
    );
  if (n === 1)
    return (
      <>
        <rect x="8" y="44" width="84" height="12" rx="5" fill={t} />
        <path d="M50 44V20M50 22L36 8M50 22L64 8" stroke="#0a1230" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="20" r="3.5" fill="#ffd27a" />
      </>
    );
  if (n === 2)
    return (
      <>
        <rect x="8" y="44" width="84" height="12" rx="5" fill={t} />
        <path d="M38 44 L36 30 M62 44 L64 30" stroke="#0a1230" strokeWidth="3" />
        <rect x="32" y="12" width="36" height="20" rx="4" fill="#0a1230" fillOpacity="0.85" />
        <path d="M30 14 L50 3 L70 14Z" fill="#0a1230" fillOpacity="0.85" />
        <circle cx="61" cy="22" r="2.6" fill="#ffd27a" />
      </>
    );
  if (n === 3)
    return (
      <>
        <rect x="34" y="6" width="32" height="46" rx="6" fill={t} />
        <path d="M30 8 L50 -8 L70 8Z" fill="#5b4fc0" />
        <circle cx="50" cy="27" r="11" fill="#fff6dc" stroke="#0a1230" strokeWidth="2" />
        <path d="M50 27H42M50 27V19" stroke="#0a1230" strokeWidth="2.5" strokeLinecap="round" />
      </>
    );
  if (n === 4)
    return (
      <>
        <path d="M4 56 L50 24 L96 56 Z" fill={t} />
        <rect x="40" y="2" width="20" height="30" fill={t} />
        <path d="M36 4 L50 -10 L64 4Z" fill="#b84a7f" />
        <path d="M45 22a5 5 0 0 1 10 0v4h-10z" fill="#ffd27a" />
      </>
    );
  return (
    <>
      <path d="M20 52 L27 30 L39 42 L50 20 L61 42 L73 30 L80 52 Z" fill="#ffd27a" stroke="#f2a93b" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="27" cy="30" r="3.2" fill="#fff6d8" />
      <circle cx="50" cy="20" r="3.6" fill="#fff6d8" />
      <circle cx="73" cy="30" r="3.2" fill="#fff6d8" />
    </>
  );
}

// a faixa de azulejo da Lenda: losangos azuis sobre creme
const AZULEJO = Array.from({ length: 10 }, (_, i) => `M${16 + i * 7.6} 56l3.8 4-3.8 4-3.8-4z`).join("");

export default function Olheiro({
  nivel,
  cor,
  tam = 48,
  className = "",
  style,
}: {
  nivel?: number;
  cor?: string;
  tam?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const n = Math.min(5, Math.max(0, nivel ?? Math.max(0, NIVEL_COR.indexOf(cor ?? ""))));
  const c = cor ?? NIVEL_COR[n];
  return (
    <span className={`lp-olheiro ${className}`} style={{ "--tam": `${tam}px`, ...style } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 -14 100 154" width={tam} height={Math.round(tam * 1.54)} style={{ color: c, overflow: "visible" }}>
        {/* corpo: o prédio, com luz em cima e sombra embaixo */}
        <rect x="12" y="50" width="76" height="78" rx="14" fill="currentColor" />
        <path d="M26 50H74A14 14 0 0 1 88 64V74H12V64A14 14 0 0 1 26 50Z" fill="#fff" opacity="0.2" />
        <path d="M12 108H88V114A14 14 0 0 1 74 128H26A14 14 0 0 1 12 114Z" fill="#0a1230" opacity="0.18" />
        {n === 5 && (
          <>
            <rect x="12" y="52" width="76" height="12" fill="#f2efe7" />
            <path d={AZULEJO} fill="#2f56b8" />
          </>
        )}
        <ellipse cx="24" cy="104" rx="5" ry="3" fill="#ff7a9a" fillOpacity="0.5" />
        <ellipse cx="76" cy="104" rx="5" ry="3" fill="#ff7a9a" fillOpacity="0.5" />
        <rect x="43" y="108" width="14" height="20" rx="7" fill="#0a1230" fillOpacity="0.5" />
        <ellipse cx="32" cy="131" rx="9" ry="4" fill="#0a1230" fillOpacity="0.55" />
        <ellipse cx="68" cy="131" rx="9" ry="4" fill="#0a1230" fillOpacity="0.55" />
        {/* olhos: as janelas acesas, com brilho, pupila e reflexo */}
        <g className="lp-ol-olhos">
          <rect className="lp-ol-brilho" x="17" y="63" width="32" height="36" rx="10" fill="#ffd27a" />
          <rect className="lp-ol-brilho" x="51" y="63" width="32" height="36" rx="10" fill="#ffd27a" />
          <rect x="22" y="68" width="22" height="26" rx="6" fill="#fff4c9" stroke="#0a1230" strokeOpacity="0.3" strokeWidth="2" />
          <rect x="56" y="68" width="22" height="26" rx="6" fill="#fff4c9" stroke="#0a1230" strokeOpacity="0.3" strokeWidth="2" />
          <g className="lp-ol-pupilas">
            <circle cx="34" cy="83" r="6" fill="#0a1230" />
            <circle cx="66" cy="83" r="6" fill="#0a1230" />
            <circle cx="31.5" cy="80.5" r="2" fill="#fff" />
            <circle cx="63.5" cy="80.5" r="2" fill="#fff" />
          </g>
        </g>
        <Telhado n={n} />
      </svg>
    </span>
  );
}
