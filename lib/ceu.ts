// O céu do app: as mesmas paradas da LP (design/tokens.mjs, "ceu"), só que
// guiadas pela hora real da cidade em vez da rolagem. Daqui saem as cores do
// topo do mapa, o tema "pela hora" e o céu da hora de cada post no story.
import { useEffect, useState } from "react";
import { ceu } from "@/design/tokens.mjs";
import { lerpStops, smooth, type Stop } from "@/components/landing/time";

const TZ = "America/Sao_Paulo";

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const CEU: Stop[] = (ceu as [number, string[]][]).map(([h, faixas]) => [h, faixas.flatMap(rgb)]);
const hex = (v: number[]) => "#" + v.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");

const partes = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });

// Hora decimal da cidade (14:30 → 14.5), seja onde for o aparelho
export function horaDaCidade(d: Date = new Date()) {
  const p = partes.formatToParts(d);
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0);
  const m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return h + m / 60;
}

export const relogio = (d: Date = new Date()) => partes.format(d);

// Para conferir o céu em qualquer hora: /mapa?ceu=6.5 finge que são 6h30 na
// cidade (o relógio, o céu e o tema pela hora andam juntos a partir daí)
function horaForcada(): number | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("ceu");
  const n = v === null ? NaN : Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n < 24 ? n : null;
}

// "Agora" na cidade: o relógio de verdade, ou deslocado para a hora forçada
export function agoraDaCidade() {
  const real = new Date();
  const f = horaForcada();
  if (f === null) return real;
  let delta = f - horaDaCidade(real);
  if (delta < 0) delta += 24;
  return new Date(real.getTime() + delta * 3600e3);
}

// As 4 faixas do céu naquela hora, do alto para o horizonte
export function coresDoCeu(h: number): [string, string, string, string] {
  const v = lerpStops(CEU, h);
  return [0, 3, 6, 9].map((i) => hex(v.slice(i, i + 3))) as [string, string, string, string];
}

// Quanto é noite (0 de dia, 1 de noite), com o amanhecer e o pôr do sol suaves
export const noiteEm = (h: number) => Math.max(1 - smooth(5, 6.6, h), smooth(18.4, 19.8, h));
// O brilho quente do amanhecer e do pôr do sol
export const quenteEm = (h: number) =>
  Math.max(smooth(4.8, 5.6, h) * (1 - smooth(6.2, 7.6, h)), smooth(16.4, 17.8, h) * (1 - smooth(18.6, 19.6, h)));

// O tema pela hora: o mapa claro entre 6h30 e 18h, escuro no resto
export const temaDaHora = (h: number) => (h >= 6.5 && h < 18 ? "light" : "dark");

// A hora da cidade, atualizada a cada 30 s (o céu anda devagar)
export function useHoraDaCidade() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setAgora(agoraDaCidade());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  return agora;
}
