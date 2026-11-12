"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Olheiro from "./Olheiro";
import { useT } from "./lang";
import { lpPaused, reducedMotion } from "./time";

// O Olheiro que reage: pula esticando e encolhendo ao toque (e ao passar o
// mouse) e solta uma fala num balão com a ponta embaixo, o mesmo canto do
// pedido "Alguém aí?". De vez em quando fala sozinho, só quando está na tela.
// Referência: os mascotes do agentes.chat.
export default function OlheiroVivo({
  cor,
  tam = 40,
  falas,
  className = "",
  style,
  sozinho = true,
  lado = "dir",
}: {
  cor: string;
  tam?: number;
  falas?: string[];
  className?: string;
  style?: CSSProperties;
  sozinho?: boolean;
  lado?: "dir" | "esq";
}) {
  const T = useT().olheiros;
  const lista = falas ?? T.falas;
  const [fala, setFala] = useState<string | null>(null);
  const [pula, setPula] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // cada Olheiro começa numa fala diferente, puxada da cor (sem sorteio no render)
  const prox = useRef(parseInt(cor.slice(1, 3), 16) % lista.length);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fala1 = () => {
    const f = lista[prox.current % lista.length];
    prox.current++;
    setFala(f);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFala(null), 2400);
  };
  const toca = () => {
    if (!reducedMotion()) setPula(true);
    fala1();
  };

  // fala sozinho a cada 9 a 16 s, se estiver na tela e a LP não estiver pausada
  useEffect(() => {
    const el = ref.current;
    if (!el || !sozinho || reducedMotion()) return;
    let visivel = false;
    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    let t: ReturnType<typeof setTimeout>;
    const agenda = () => {
      t = setTimeout(() => {
        if (visivel && !lpPaused()) {
          setPula(true);
          fala1();
        }
        agenda();
      }, 9000 + Math.random() * 7000);
    };
    agenda();
    return () => (clearTimeout(t), io.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sozinho]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      ref={ref}
      type="button"
      className={`lp-vivo ${pula ? "is-pula" : ""} ${className}`}
      style={style}
      aria-label={T.toque}
      onClick={toca}
      onPointerEnter={(e) => e.pointerType === "mouse" && !pula && !reducedMotion() && setPula(true)}
      onAnimationEnd={(e) => e.animationName === "lp-pulo" && setPula(false)}
    >
      <span className="lp-vivo-corpo">
        <Olheiro cor={cor} tam={tam} />
      </span>
      <span className={`lp-vivo-fala lp-vivo-fala-${lado}`} data-on={fala ? "true" : "false"} aria-hidden="true">
        {fala ?? lista[0]}
      </span>
    </button>
  );
}

// O voo: o Olheiro do meio do trio do herói (data-ninho) decola quando o
// problema chega a 60% da tela e pousa no primeiro cartão (data-pouso), num
// arco, esticando na saída e no pouso. Subindo de volta, faz o caminho
// inverso. O lugar dele no trio fecha enquanto ele está fora.
//
// O voo é desenhado quadro a quadro, mirando a posição ATUAL da saída e do
// pouso: se a pessoa continua rolando durante o voo, ele acompanha e pousa no
// cartão, sem pular no fim. Não voa quando a página abre já rolada (fica
// direto no lugar certo) nem quando os dois pontos estão fora da tela.
const VOO_MS = 900;
const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function VooOlheiro({ cor, tam = 56 }: { cor: string; tam?: number }) {
  const voador = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ninho = document.querySelector<HTMLElement>("[data-ninho]");
    const pouso = document.querySelector<HTMLElement>("[data-pouso]");
    const v = voador.current;
    if (!ninho || !pouso || !v) return;
    const passouEm = () => pouso.getBoundingClientRect().top < window.innerHeight * 0.6;
    const coloca = (fora: boolean) => {
      ninho.dataset.vazio = fora ? "true" : "false";
      pouso.dataset.pousado = fora ? "true" : "false";
    };
    if (reducedMotion()) {
      // sem voo: ele já está no cartão, e o trio fica completo
      pouso.dataset.pousado = "true";
      return;
    }

    let fora = passouEm();
    coloca(fora);
    let voo: { de: HTMLElement; para: HTMLElement; t0: number; chegou: () => void } | null = null;
    let rafVoo = 0;

    const naTela = (r: DOMRect) => r.bottom > 0 && r.top < window.innerHeight;
    const quadro = (agora: number) => {
      rafVoo = 0;
      if (!voo) return;
      const a = voo.de.getBoundingClientRect(), b = voo.para.getBoundingClientRect();
      const k = Math.min(1, (agora - voo.t0) / VOO_MS);
      const e = suave(k);
      const ax = a.left + a.width / 2, bx = b.left + b.width / 2;
      const x = ax + (bx - ax) * e;
      const y = a.bottom + (b.bottom - a.bottom) * e - Math.sin(Math.PI * e) * 150;
      // estica ao sair e ao chegar, inclina para o lado do voo
      const estica = k < 0.12 ? 1 - k / 0.12 : k > 0.88 ? (k - 0.88) / 0.12 : 0;
      const sx = 1 + estica * 0.12, sy = 1 - estica * 0.14;
      const giro = Math.sin(Math.PI * e) * (bx > ax ? 8 : -8);
      v.style.transform = `translate(${x - v.offsetWidth / 2}px, ${y - v.offsetHeight}px) rotate(${giro.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      if (k < 1) rafVoo = requestAnimationFrame(quadro);
      else {
        const fim = voo.chegou;
        voo = null;
        v.dataset.on = "false";
        fim();
      }
    };
    const voa = (de: HTMLElement, para: HTMLElement, chegou: () => void) => {
      // os dois pontos fora da tela: ninguém veria o voo, então só troca de lugar
      if (!naTela(de.getBoundingClientRect()) && !naTela(para.getBoundingClientRect())) {
        voo = null;
        v.dataset.on = "false";
        chegou();
        return;
      }
      voo = { de, para, t0: performance.now(), chegou };
      v.dataset.on = "true";
      if (!rafVoo) rafVoo = requestAnimationFrame(quadro);
    };

    // passou = o topo do cartão subiu acima de 60% da tela. Medido a cada
    // quadro de rolagem: o IntersectionObserver não avisa quando o cartão pula
    // de "acima da tela" para "abaixo da tela" (voltar ao topo de uma vez)
    let raf = 0;
    const confere = () => {
      raf = 0;
      const passou = passouEm();
      if (passou === fora) return;
      fora = passou;
      if (passou) {
        ninho.dataset.vazio = "true";
        pouso.dataset.pousado = "false";
        voa(ninho, pouso, () => (pouso.dataset.pousado = "true"));
      } else {
        pouso.dataset.pousado = "false";
        voa(pouso, ninho, () => (ninho.dataset.vazio = "false"));
      }
    };
    const pede = () => {
      if (!raf) raf = requestAnimationFrame(confere);
    };
    window.addEventListener("scroll", pede, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafVoo);
      window.removeEventListener("scroll", pede);
    };
  }, []);

  return (
    <div ref={voador} className="lp-voador" data-on="false" aria-hidden="true">
      <Olheiro cor={cor} tam={tam} />
      <span className="lp-voador-sombra" />
    </div>
  );
}
