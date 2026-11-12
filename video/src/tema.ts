// Paleta do redesign "Noite" (design/tokens.mjs, tema escuro): a cidade vista de noite, com a luz da janela acesa
// (#ffd27a) de destaque. Profundidade é fundo → superfície → elevado → borda de 1 px.
export const COR = {
  bg: '#0a1230',
  surface: '#111b40',
  elev: '#1a2756',
  line: '#2e3f7a',
  ink: '#f3f5ff',
  muted: '#a9b3d9',
  // o destaque da marca é a luz da janela acesa (--luz); o texto por cima é a tinta da noite
  accent: '#ffd27a',
  accentInk: '#0a1230',
  ok: '#5bd1b5',
  warn: '#ffc35c',
  danger: '#ff6b6b',
  marco: '#3563d9',
  marcoInk: '#f2efe7',
  marcoTexto: '#8fb0f5',
};

// Corpo dos pinos (o pino-olho): a severidade da categoria (lib/categories.ts → design/tokens.mjs). A trilha é o
// anel do tempo apagado, a tinta da noite a 22%.
export const SEVERIDADE = {
  acc: { cor: '#ffffff', trilha: '#2a3560' },
  warn: { cor: COR.warn, trilha: '#2a3560' },
  danger: { cor: COR.danger, trilha: '#2a3560' },
  ink: { cor: COR.ink, trilha: '#2a3560' },
} as const;
export type Severidade = keyof typeof SEVERIDADE;

// Ilustrações e a cidade em miniatura: a mesma família das cenas isométricas da LP (components/landing/iso.tsx).
export const CENA = {
  ceuNoite: '#0c1945',
  ceuFundo: '#070d2a',
  agua: '#13265f',
  aguaClara: '#8fb0f5',
  luz: '#ffd27a',
  luzJanela: '#ffd27a',
  telha: '#9d8ff2',
  telhaEscura: '#7465d6',
  pedra: '#d6dcf2',
  creme: '#e6eaf8',
  chao: '#16275e',
  rua: '#0f1c4c',
  calcada: '#22377a',
  praca: '#17344f',
  folha: '#23896f',
  folhaClara: '#38b896',
};
