// A geometria da marca do Viu (logo "Pino-olho"): o pin do mapa com um olho.
// Fonte única, lida pelo componente (components/ui/Mark.tsx), pelas imagens de
// compartilhamento (app/**/opengraph-image.tsx) e pelo gerador do favicon e
// dos ícones do app (scripts/gerar-icones.mjs).

// o pin, numa caixa de 100×120 com a ponta embaixo
export const PINO_PATH = "M50 114C40 96 14 76 14 46A36 36 0 1 1 86 46C86 76 60 96 50 114Z";

// as cores da noite: o pin é a luz da janela acesa, o olho é branco e a
// pupila e o anel são a tinta do céu de noite
export const NOITE = { pino: "#ffd27a", olho: "#ffffff", tinta: "#0a1230" };

// O desenho como texto SVG (sem a tag <svg>), na caixa 0 0 100 120.
// O anel em volta da pupila é o tempo que esvazia, cheio a 72%.
// simples: sem o anel e com a pupila maior, para o favicon, onde o anel vira borrão.
export function marcaSvg({ cores = NOITE, simples = false } = {}) {
  const anel = simples
    ? ""
    : `<circle cx="50" cy="46" r="16.5" fill="none" stroke="${cores.tinta}" stroke-opacity="0.12" stroke-width="5"/>` +
      `<circle cx="50" cy="46" r="16.5" fill="none" stroke="${cores.tinta}" stroke-width="5" pathLength="100" stroke-dasharray="72 100" stroke-linecap="round" transform="rotate(-90 50 46)"/>`;
  return (
    `<path d="${PINO_PATH}" fill="${cores.pino}"/>` +
    `<circle cx="50" cy="46" r="${simples ? 24 : 22}" fill="${cores.olho}"/>` +
    anel +
    `<circle cx="50" cy="46" r="${simples ? 11 : 8}" fill="${cores.tinta}"/>` +
    `<circle cx="46.6" cy="42.6" r="${simples ? 3.4 : 2.6}" fill="${cores.olho}"/>`
  );
}
