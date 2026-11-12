// Gera o favicon e os ícones do app a partir da marca (design/marca.mjs):
//   app/icon.svg              favicon: ladrilho da noite + pin simples (sem anel)
//   public/icon.svg           ícone do app (manifest), com o anel do tempo
//   public/icons/icon-192.png e icon-512.png
//   app/apple-icon.png        180 px, quadrado cheio (o iOS aplica a máscara)
// Uso: npm run icones. Antes os PNG saíam à mão (qlmanage); agora saem daqui.
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { marcaSvg } from "../design/marca.mjs";

const caminho = (p) => new URL(`../${p}`, import.meta.url);

// o ladrilho: o céu de noite em degradê, com o pin no meio
const ladrilho = ({ raio, simples, escala }) => {
  const w = 100 * escala, h = 120 * escala;
  const x = (100 - w) / 2, y = (100 - h) / 2 + 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a48"/><stop offset="1" stop-color="#1d3f99"/></linearGradient></defs>` +
    `<rect width="100" height="100" rx="${raio}" fill="url(#c)"/>` +
    `<g transform="translate(${x} ${y}) scale(${escala})">${marcaSvg({ simples })}</g>` +
    `</svg>`
  );
};

const favicon = ladrilho({ raio: 22, simples: true, escala: 0.72 });
const app = ladrilho({ raio: 22, simples: false, escala: 0.62 });
const apple = ladrilho({ raio: 0, simples: false, escala: 0.62 });

writeFileSync(caminho("app/icon.svg"), favicon);
writeFileSync(caminho("public/icon.svg"), app);
await sharp(Buffer.from(app), { density: 600 }).resize(192, 192).png().toFile(caminho("public/icons/icon-192.png").pathname);
await sharp(Buffer.from(app), { density: 600 }).resize(512, 512).png().toFile(caminho("public/icons/icon-512.png").pathname);
await sharp(Buffer.from(apple), { density: 600 }).resize(180, 180).png().toFile(caminho("app/apple-icon.png").pathname);
console.log("ícones gerados a partir de design/marca.mjs");
