// Relógio de missão do app (h:mm:ss), para os posts de exemplo da LP
export function clock(s: number) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// A LP está pausada pelo botão do rodapé?
export const lpPaused = () => Boolean(document.querySelector(".lp-pausado"));
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- o motor do céu ----------
// Saiu da DaySection para servir também ao céu da página (CeuDoDia).

// Hora decimal → "hh:mm" (passa de 24 e volta a zero)
export const fmt = (h: number) => {
  const x = ((h % 24) + 24) % 24;
  return `${String(Math.floor(x)).padStart(2, "0")}:${String(Math.floor((x % 1) * 60)).padStart(2, "0")}`;
};

// Interpolação por pontos (hora → valores)
export type Stop = [number, number[]];
export const lerpStops = (stops: Stop[], h: number) => {
  if (h <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [h1, v1] = stops[i];
    const [h0, v0] = stops[i - 1];
    if (h <= h1) {
      const t = (h - h0) / (h1 - h0);
      return v0.map((v, k) => v + (v1[k] - v) * t);
    }
  }
  return stops[stops.length - 1][1];
};

// Degrau suave entre a e b
export const smooth = (a: number, b: number, h: number) => {
  const t = Math.min(1, Math.max(0, (h - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Escreve um estilo só se mudou (o último valor fica guardado por elemento e
// propriedade). Mexer em estilo a cada quadro sem isso recalcula à toa.
const written = new WeakMap<Element, Record<string, string>>();
export function put(el: (HTMLElement | SVGElement) | null, prop: string, value: string) {
  if (!el) return;
  let last = written.get(el);
  if (!last) written.set(el, (last = {}));
  if (last[prop] === value) return;
  last[prop] = value;
  el.style.setProperty(prop, value);
}
export const putAll = (els: (HTMLElement | SVGElement)[], prop: string, value: string) => els.forEach((el) => put(el, prop, value));

// Arco do sol e da lua no céu: x de 0 a 1 → [left %, top %]
export const arc = (x: number): [number, number] => [8 + 84 * x, 30 - Math.sin(Math.PI * Math.min(1, Math.max(0, x))) * 22];
