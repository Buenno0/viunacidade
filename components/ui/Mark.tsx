import { PINO_PATH, marcaSvg } from "@/design/marca.mjs";
// A marca do Viu (logo C, "Pino-olho", escolhido em 11/11/2026): o pin do
// mapa com um olho. O lugar exato e quem viu. O anel em volta da pupila é o
// tempo que esvazia, o mesmo anel dos pins do app (cheio a 72%, para ler como
// anel e não como círculo). O pin é a luz da janela acesa (--luz), o olho é
// branco e a pupila e o anel são a tinta da noite (--luz-ink).
//
// Uma geometria só, em três lugares que leem daqui: o componente (com as
// variáveis do tema), marcaSvg() para as imagens de compartilhamento e
// scripts/gerar-icones.mjs para o favicon e os ícones do app, todos a partir
// de design/marca.mjs.
//
// O contorno de Itapetininga (CITY_PATH) era a marca até o redesign "Noite";
// fica exportado para quem ainda desenha a cidade.
export const CITY_PATH =
  "M78.9 45.3L75.6 45.3L75.5 38.2L72.6 37L70.6 32L71.2 29.6L76.5 31.5L89.1 30L93.6 25.7L88.2 25.7L84.8 19.7L80.4 19.5L75.1 22.3L75.8 15.6L73 13.8L65.8 17.3L59.5 17.7L57.8 15.6L54.3 15.4L48.6 21.6L41.2 24.8L40.2 27.6L37.5 26.9L37.2 28.3L31 31.5L27.2 38.7L22.7 39.5L21.3 42.9L17.2 43.5L15.5 40.4L14.7 41.6L13.9 40.3L10 40.9L12.4 54L6 62.7L7.9 64.4L7.6 66.8L6.2 66.4L7.4 69L9.3 69.7L8.2 73.4L11.7 75.9L12.2 78L10.9 78.6L17.2 82.9L16.2 85.1L18.1 85.2L19.1 82.1L22.6 80.6L26 84.7L30.5 86.2L32.2 84.3L43.5 82.9L48.1 80.3L57.1 69.8L60.4 69.8L61.6 71.2L66.2 67.3L74.8 67.7L74 69.1L77 75.3L82 73.1L85.4 73.7L89.1 63.7L86.8 63.7L82.6 59.7L83.1 54.2L77.8 47.5Z";
export const PIN_PATH = "M58 43C55 37 49 33 49 27A9 9 0 0 1 67 27C67 33 61 37 58 43Z";


// a geometria mora em design/marca.mjs (fonte única com os ícones)
export { PINO_PATH, marcaSvg };

// size é a altura; a largura sai da proporção do pin (100×120)
export default function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 120" width={Math.round((size * 100) / 120)} height={size} className={className} aria-hidden="true">
      <path d={PINO_PATH} fill="var(--marca-pino, var(--luz))" stroke="var(--luz-ink)" strokeOpacity="0.14" strokeWidth="2" />
      <circle cx="50" cy="46" r="22" fill="#fff" />
      <circle cx="50" cy="46" r="16.5" fill="none" stroke="var(--luz-ink)" strokeOpacity="0.12" strokeWidth="5" />
      <circle cx="50" cy="46" r="16.5" fill="none" stroke="var(--luz-ink)" strokeWidth="5" pathLength={100} strokeDasharray="72 100" strokeLinecap="round" transform="rotate(-90 50 46)" />
      <circle cx="50" cy="46" r="8" fill="var(--luz-ink)" />
      <circle cx="46.6" cy="42.6" r="2.6" fill="#fff" />
    </svg>
  );
}
