// Fonte única da paleta do Viu. Redesign "Noite" (11/11/2026): a cidade vista
// de noite, com as janelas acesas. O escuro é o céu azul-marinho; o claro é o
// mesmo céu de dia. A marca é o amarelo da janela acesa (--luz), o botão
// principal é branco sobre a noite e azul sobre o dia, e o vermelho continua
// reservado ao que está acontecendo agora.
//
// Substitui o "mural da cidade" (papel de jornal, nenhum acento). A decisão e
// as referências estão em DESIGN.md §1.
//
// Tudo que precisa de cor lê daqui:
//   - app/tokens.css         gerado por scripts/gerar-tokens.mjs (npm run tokens)
//   - scripts/contraste.mjs  mede os pares em cima destes valores
// O mapa tem cores próprias em lib/map/style.ts, puxadas para o mesmo azul.

export const tema = {
  escuro: {
    bg: "#0a1230", // céu de noite
    surface: "#111b40",
    elev: "#1a2756",
    line: "#2e3f7a",
    ink: "#f3f5ff",
    muted: "#a9b3d9",
    accent: "#ffffff", // botão principal: branco sobre a noite
    accentInk: "#0a1230",
    ok: "#5bd1b5",
    warn: "#ffc35c",
    danger: "#ff6b6b", // o vermelho do agora
    luz: "#ffd27a", // a janela acesa: marca, nível, destaque
    luzInk: "#0a1230",
    marco: "#3563d9", // azul azulejo: só os marcos da cidade
    marcoInk: "#f2efe7",
    marcoTexto: "#8fb0f5",
  },
  claro: {
    bg: "#eef2fb", // céu de dia
    surface: "#ffffff",
    elev: "#e2e8f6",
    line: "#c3cde6",
    ink: "#0a1230",
    muted: "#4b5679",
    accent: "#2f56b8", // botão principal: azul sobre o dia
    accentInk: "#ffffff",
    ok: "#0e7a5c",
    warn: "#9a5800",
    danger: "#c62a2a",
    luz: "#ffd27a",
    luzInk: "#0a1230",
    marco: "#1b3fa8",
    marcoInk: "#f2efe7",
    marcoTexto: "#1b3fa8",
  },
};

// Sala escura: chrome desenhado POR CIMA de foto usa sempre o escuro, mesmo no
// tema claro.
export const salaEscura = ["accent", "accentInk", "ink", "muted", "ok", "warn", "danger", "luz", "luzInk"];

// Severidade de cada categoria → uma das três semânticas (ou o acento).
// Não existe cor por categoria: a foto é a cor; a categoria é rótulo + ícone.
export const severidade = {
  acidente: "danger",
  seguranca: "danger",
  alagamento: "warn",
  falta_energia: "warn",
  transito: "warn",
  obra: "warn",
  evento: "accent",
  outro: "accent",
};

export const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

// O céu da LP ao longo do dia (CeuDoDia.tsx): hora → quatro faixas, de cima
// para o horizonte. As três de cima seguram texto branco a 4,5:1 em qualquer
// hora (scripts/contraste.mjs mede); a do horizonte é livre, porque ali o
// conteúdo é cartão branco. O dia é azul vivo, nunca azul-clarinho.
export const ceu = [
  [0, ["#050a1e", "#0a1640", "#13265f", "#1f3a80"]],
  [4.5, ["#070d26", "#0d1a48", "#172c68", "#2b3f86"]],
  [5.5, ["#121d4f", "#23367c", "#3c4f97", "#e0906c"]],
  [7, ["#1b4aa6", "#2558b9", "#2f62c2", "#9cc0f2"]],
  [10, ["#1a4cb0", "#2559c0", "#2f63c6", "#a9cbf6"]],
  [15, ["#1a4cb0", "#2559c0", "#2f63c6", "#a9cbf6"]],
  [17, ["#1f47a3", "#2d58b4", "#3d5fb3", "#f2c08a"]],
  [18.2, ["#1d2c6e", "#363c8a", "#6a4a8a", "#f08a5c"]],
  [19.3, ["#0d1a4c", "#1c2c6c", "#2f3f84", "#6a5a8e"]],
  [21, ["#070d2a", "#0c1945", "#152a62", "#24407f"]],
  [24, ["#050a1e", "#0a1640", "#13265f", "#1f3a80"]],
];
