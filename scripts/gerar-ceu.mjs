// Gera os SVGs do céu da LP em public/landing/ (npm run ceu). Tudo vetor, para
// ficar nítido em tela retina; o sorteio tem semente fixa, então rodar de novo
// dá o mesmo desenho.
//   estrelas-a.svg, estrelas-b.svg  dois ladrilhos que piscam alternados
//   horizonte-silhueta.svg          os prédios, a igreja e a caixa d'água
//   horizonte-janelas.svg           só as janelas, que acendem à noite
//   nuvens.svg                      nuvens macias, que só aparecem de dia
import { writeFileSync } from "node:fs";

const out = (nome, svg) => writeFileSync(new URL(`../public/landing/${nome}`, import.meta.url), svg);
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const svg = (w, h, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${corpo}</svg>`;

// estrelas: dois ladrilhos de 1440×900 com sementes diferentes
for (const [nome, seed] of [["estrelas-a.svg", 11], ["estrelas-b.svg", 29]]) {
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < 80; i++) {
    const b = r();
    s += `<circle cx="${(r() * 1440).toFixed(1)}" cy="${(r() * 900).toFixed(1)}" r="${(0.5 + b).toFixed(2)}" fill="#fff" opacity="${(0.3 + 0.55 * b).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const x = (r() * 1440).toFixed(1), y = (r() * 600).toFixed(1);
    s += `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".08"/><circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".9"/>`;
  }
  out(nome, svg(1440, 900, s));
}

// horizonte: 2400×320, duas camadas de prédios, igreja no meio e caixa d'água
const W = 2400, H = 320;
const r = rng(8);
const camadas = [
  { cor: "#1b3274", jan: "#7f9be6", seed: 3, min: 90, max: 210, p: 0.1 },
  { cor: "#0a1433", jan: "#ffd27a", seed: 5, min: 50, max: 160, p: 0.26 },
];
let silhueta = "", janelas = "";
for (const c of camadas) {
  const rr = rng(c.seed);
  let x = -10, predios = "", jan = "";
  while (x < W) {
    const w = 44 + Math.floor(rr() * 52), h = c.min + Math.floor(rr() * (c.max - c.min));
    predios += `<rect x="${x}" y="${H - h}" width="${w}" height="${h}"/>`;
    for (let y = H - h + 12; y < H - 14; y += 17)
      for (let xx = x + 8; xx < x + w - 12; xx += 14) if (rr() < c.p) jan += `<rect x="${xx}" y="${y}" width="7" height="9"/>`;
    x += w + 2 + Math.floor(rr() * 8);
  }
  silhueta += `<g fill="${c.cor}">${predios}</g>`;
  janelas += `<g fill="${c.jan}">${jan}</g>`;
}
const g = 1180, k = 1700, b = H;
silhueta +=
  `<g fill="#0a1433"><rect x="${g - 52}" y="${b - 120}" width="104" height="120"/><path d="M${g - 58} ${b - 120}L${g} ${b - 166}L${g + 58} ${b - 120}Z"/>` +
  `<rect x="${g - 17}" y="${b - 250}" width="34" height="132"/><path d="M${g - 22} ${b - 250}L${g} ${b - 306}L${g + 22} ${b - 250}Z"/>` +
  `<rect x="${g - 2}" y="${b - 332}" width="4" height="30"/><rect x="${g - 10}" y="${b - 322}" width="20" height="4"/>` +
  `<rect x="${k - 30}" y="${b - 230}" width="60" height="50" rx="4"/><path d="M${k - 32} ${b - 230}L${k} ${b - 248}L${k + 32} ${b - 230}Z"/>` +
  `<path d="M${k - 22} ${b - 180}L${k - 30} ${b}L${k - 24} ${b}L${k - 16} ${b - 180}ZM${k + 16} ${b - 180}L${k + 24} ${b}L${k + 30} ${b}L${k + 22} ${b - 180}Z"/>` +
  `<rect x="${k - 26}" y="${b - 120}" width="52" height="4"/></g>`;
janelas += `<circle cx="${g}" cy="${b - 196}" r="8" fill="#ffd27a"/>`;
let arvores = "";
for (let i = 0; i < 70; i++) {
  const x = r() * W, rad = 10 + r() * 12;
  arvores += `<circle cx="${x.toFixed(0)}" cy="${(H - rad * 0.7).toFixed(0)}" r="${rad.toFixed(0)}"/>`;
}
silhueta += `<g fill="#070e28">${arvores}</g><rect x="0" y="${H - 8}" width="${W}" height="8" fill="#070e28"/>`;
out("horizonte-silhueta.svg", svg(W, H, silhueta));
out("horizonte-janelas.svg", svg(W, H, janelas));

// nuvens: três nuvens macias num ladrilho largo, feitas de círculos com desfoque
const rn = rng(17);
let nuvens = `<defs><filter id="m" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs><g fill="#fff" filter="url(#m)">`;
for (const [cx, cy, s] of [[260, 120, 1], [1150, 210, 1.3], [1980, 90, 0.85]]) {
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * 34 * s, rad = (26 + rn() * 22) * s * (1 - Math.abs(i - 3) * 0.12);
    nuvens += `<circle cx="${(cx + dx).toFixed(0)}" cy="${(cy - rad * 0.35).toFixed(0)}" r="${rad.toFixed(0)}" opacity=".9"/>`;
  }
  nuvens += `<rect x="${(cx - 120 * s).toFixed(0)}" y="${cy}" width="${(240 * s).toFixed(0)}" height="${(26 * s).toFixed(0)}" rx="${(13 * s).toFixed(0)}"/>`;
}
nuvens += "</g>";
out("nuvens.svg", svg(2400, 300, nuvens));
console.log("céu gerado em public/landing/");
