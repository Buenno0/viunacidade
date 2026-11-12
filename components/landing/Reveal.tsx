"use client";

import { useEffect } from "react";

// Liga os movimentos de página da LP, sem um listener por elemento:
//
// 1. Entrada: marca o wrapper (.lp-anim) e, quando cada bloco entra na tela,
//    põe .lp-in (uma vez só). A entrada é opacidade + desfoque + subida, e os
//    filhos de .lp-rvg entram em sequência (--rv-d). Sem JS, tudo já aparece.
// 2. Fora da tela: pausa as animações (.lp-fora). São ~170 animações
//    infinitas, e animar o que ninguém vê só gasta CPU e bateria.
// 3. Inclinação e luz: em .lp-tilt, o cartão inclina em 3D na direção do
//    mouse (--rx, --ry) e uma luz segue o ponteiro (--mx, --my). Só com mouse,
//    e nunca com movimento reduzido. Referência: os cards do agentes.chat.
export default function Reveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root) return;
    const off = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("lp-fora", !e.isIntersecting)),
      { rootMargin: "120px 0px" },
    );
    root.querySelectorAll("main > section, main > div, main > .lp-faixa").forEach((el) => off.observe(el));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => off.disconnect();

    root.querySelectorAll<HTMLElement>(".lp-rvg").forEach((g) =>
      [...g.children].forEach((c, i) => (c as HTMLElement).style.setProperty("--rv-d", `${Math.min(i, 6) * 0.08}s`)),
    );
    root.classList.add("lp-anim");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("lp-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    root.querySelectorAll(".lp-rv, .lp-rvg").forEach((el) => io.observe(el));

    // inclinação e luz
    let ativo: HTMLElement | null = null;
    const solta = () => {
      if (!ativo) return;
      ativo.style.removeProperty("--rx");
      ativo.style.removeProperty("--ry");
      ativo.classList.remove("is-luz");
      ativo = null;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest<HTMLElement>(".lp-tilt");
      if (el !== ativo) solta();
      if (!el) return;
      ativo = el;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.classList.add("is-luz");
    };
    const fino = window.matchMedia("(pointer: fine)").matches;
    if (fino) {
      root.addEventListener("pointermove", move, { passive: true });
      root.addEventListener("pointerleave", solta);
    }
    return () => {
      io.disconnect();
      off.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", solta);
    };
  }, []);
  return null;
}
