"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { tema } from "@/design/tokens.mjs";
import { agoraDaCidade, horaDaCidade, temaDaHora } from "./ceu";

// Portado do NAS (web/src/lib/theme.tsx): o tema novo nasce num círculo a
// partir do botão clicado, 520ms. O script inline do layout aplica o tema
// salvo antes da primeira pintura; aqui só o lemos.

export type Theme = "dark" | "light";
// "hora": sem escolha salva, o tema segue o céu da cidade (claro de dia)
export type ThemeMode = Theme | "hora";

export const THEME_KEY = "deolho-tema";
const DURACAO = 520;

type Ctx = { theme: Theme; mode: ThemeMode; toggle: (evento?: MouseEvent) => void; setMode: (m: ThemeMode, evento?: MouseEvent) => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", mode: "hora", toggle: () => {}, setMode: () => {} });

function modoSalvo(): ThemeMode {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "hora";
  } catch {
    return "hora";
  }
}

function atual(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

// O tema mora na classe do <html> (posta pelo script de boot). O React o lê
// por useSyncExternalStore: na hidratação usa o valor do servidor ("dark") e
// logo depois o real, sem erro de hidratação nem árvore refeita.
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function aplicar(t: Theme, salvar: ThemeMode | null) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(t);
  if (salvar)
    try {
      if (salvar === "hora") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, salvar);
    } catch {
      // navegação privada pode recusar; o tema só não fica salvo
    }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "light" ? tema.claro.bg : tema.escuro.bg);
  // síncrono: dentro do flushSync da View Transition o React já pinta o novo
  for (const fn of listeners) fn();
}

function esmaecer() {
  document.documentElement.dataset.temaTrocando = "sim";
  window.setTimeout(() => delete document.documentElement.dataset.temaTrocando, DURACAO);
}

const modoListeners = new Set<() => void>();
const subscribeModo = (fn: () => void) => {
  modoListeners.add(fn);
  return () => modoListeners.delete(fn);
};

// Troca o tema com o círculo saindo do toque (ou um esmaecer, sem View Transition)
function transicionar(proximo: Theme, salvar: ThemeMode | null, evento?: MouseEvent) {
  const x = evento?.clientX ?? window.innerWidth / 2;
  const y = evento?.clientY ?? window.innerHeight / 2;
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (proximo === atual()) return aplicar(proximo, salvar);

  if (typeof document.startViewTransition !== "function" || reduzido) {
    if (!reduzido) esmaecer();
    aplicar(proximo, salvar);
    return;
  }

  const transicao = document.startViewTransition(() => {
    flushSync(() => aplicar(proximo, salvar));
  });
  transicao.ready
    .then(() => {
      const raio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
        { duration: DURACAO, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(esmaecer);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, atual, () => "dark");
  const mode = useSyncExternalStore<ThemeMode>(subscribeModo, modoSalvo, () => "hora");

  const setMode = useCallback((m: ThemeMode, evento?: MouseEvent) => {
    const proximo = m === "hora" ? (temaDaHora(horaDaCidade(agoraDaCidade())) as Theme) : m;
    transicionar(proximo, m, evento);
    for (const fn of modoListeners) fn();
  }, []);

  const toggle = useCallback((evento?: MouseEvent) => setMode(atual() === "dark" ? "light" : "dark", evento), [setMode]);

  // Pela hora: confere a cada minuto se o céu virou (amanhecer, pôr do sol)
  useEffect(() => {
    if (mode !== "hora") return;
    const confere = () => {
      const t = temaDaHora(horaDaCidade(agoraDaCidade())) as Theme;
      if (t !== atual()) transicionar(t, null);
    };
    confere();
    const id = setInterval(confere, 60_000);
    return () => clearInterval(id);
  }, [mode]);

  return <ThemeContext.Provider value={{ theme, mode, toggle, setMode }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Roda no <head> antes de pintar: a escolha salva vence; sem escolha, o tema
// segue a hora da cidade (claro das 6h30 às 18h). Mesma regra de lib/ceu.ts.
export const themeBootScript = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}");}catch(e){}if(t!=="light"&&t!=="dark"){var c="dark";try{var p=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"America/Sao_Paulo"}).format(new Date()).split(":");var h=+p[0]+p[1]/60;if(h>=6.5&&h<18)c="light";}catch(e){}t=c;}document.documentElement.classList.add(t);})();`;
