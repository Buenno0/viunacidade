"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { SEVERITY, janela, severityVar, type CityAlert } from "@/lib/alerts";

import { CATEGORIES, severityVar as corDaCategoria } from "@/lib/categories";
import { isFresh, timeAgo, type PostFeature } from "@/lib/posts";
import { levelName, levelProgress, type Progress } from "@/lib/progress";
import Olheiro from "./landing/Olheiro";
import Mark from "./ui/Mark";
import { cx } from "./ui";
import { BellIcon, CategoryIcon } from "./ui/icons";

// O topo do mapa (direção A, pílula "P2 · Borda de luz e véu", canvas "Viu:
// o app na Noite"). Uma pílula escura centralizada, com o contorno da janela
// acesa, flutuando sobre o mapa; atrás dela, um véu escurece o alto do mapa
// (forte de noite, suave de dia) para a pílula nunca se misturar com as ruas.
// Na pílula: a marca, o pulso da cidade, o sino dos alertas e a conta.
// Embaixo, os filtros.
//
// O pulso da cidade é o meio da pílula: o que aconteceu por último (os três
// mais recentes se alternam devagar) e quanto tem no ar; o toque abre o story.
// Aviso do INMET valendo tem prioridade; o que ainda vai começar aparece
// quando não há post no ar ("Tempestade a caminho"). Sem nada, "Tudo calmo". A hora
// saiu: o celular já mostra o relógio na barra de cima.
//
// A pílula e os filtros ocupam só a própria largura: o resto do mapa continua
// arrastável, e nenhum ancestral leva pointer-events-none (no iPhone, rolagem
// horizontal dentro de um elemento assim não rola). O véu é irmão, não pai.

// Quando o aviso começa, curto para caber na pílula: "23:00" se for hoje,
// "sex 0h" se for outro dia (o janela() completo vai no rótulo de leitura)
const TZ = "America/Sao_Paulo";
const diaCidade = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const horaCurta = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: TZ });
function comeco(iso: string, agora: number) {
  const d = new Date(iso);
  const hoje = diaCidade.format(d) === diaCidade.format(new Date(agora));
  // hora cheia vira "0h", "23h"; o resto fica "14:30"
  const [h, m] = horaCurta.format(d).split(":");
  const hora = m === "00" ? `${Number(h)}h` : `${h}:${m}`;
  return hoje ? hora : `${semana.format(d).replace(".", "")} ${hora}`;
}

// Aviso do INMET de chuva forte: o registrar sugere Alagamento primeiro
export const ehTempestade = (a: CityAlert | null) => Boolean(a?.live && /tempest|chuv|temporal|granizo|vendaval/i.test(a.kind));

type Props = {
  rotulo: string;
  // os posts mais recentes, do mais novo para o mais velho
  ultimos: PostFeature[];
  // a lista ainda não chegou
  carregando?: boolean;
  onAbrirPost: (id: string) => void;
  acesas: number;
  aviso: CityAlert | null;
  onAviso: () => void;
  onAlertas: () => void;
  // no histórico, o dia escolhido no lugar do relógio
  dia?: string | null;
  conta: ReactNode;
  // até onde o topo vai (px do alto da tela), para o que fica embaixo dele
  onAltura?: (px: number) => void;
  children?: ReactNode;
};

export default function CeuDoApp({ rotulo, ultimos, carregando = false, onAbrirPost, acesas, aviso, onAviso, onAlertas, dia, conta, onAltura, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const avisa = useRef(onAltura);
  useEffect(() => {
    avisa.current = onAltura;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => avisa.current?.(el.getBoundingClientRect().bottom));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // o relógio do "há 2 min" e a vez de cada post no pulso (troca a cada 5 s)
  const [agora, setAgora] = useState<number | null>(null);
  const [vez, setVez] = useState(0);
  const roda = ultimos.length > 1 && !dia && !aviso?.live;
  useEffect(() => {
    const tick = () => setAgora(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  useEffect(() => {
    if (!roda || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setVez((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, [roda]);

  const post = !dia && !aviso?.live && ultimos.length ? ultimos[vez % ultimos.length].properties : null;
  const corAviso = aviso ? severityVar(aviso.severity) : "var(--luz)";

  // as duas linhas do pulso, conforme o momento
  let icone: ReactNode = null;
  let titulo: ReactNode;
  let linha: ReactNode;
  let corLinha = acesas ? "var(--luz)" : "#c4cbe8";
  let toque: (() => void) | null = null;
  let rotuloToque = "";
  if (dia) {
    titulo = <span className="text-luz">{dia}</span>;
    linha = rotulo;
  } else if (aviso?.live) {
    titulo = <span style={{ color: corAviso }}>{aviso.kind}</span>;
    linha = `${SEVERITY[aviso.severity].label} · ${rotulo}`;
    corLinha = corAviso;
    toque = onAviso;
    rotuloToque = `${aviso.kind}, ${SEVERITY[aviso.severity].label}. Ver o aviso do INMET`;
  } else if (post) {
    const cor = post.category === "estabelecimento" ? "var(--ink)" : corDaCategoria(post.category);
    const nome = post.category === "estabelecimento" ? (post.business_name ?? CATEGORIES[post.category].label) : CATEGORIES[post.category].label;
    icone = (
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: cor, color: cor, background: `color-mix(in oklab, ${cor} 18%, transparent)` }}>
        <CategoryIcon category={post.category} width="17" height="17" />
        {agora !== null && isFresh(post.created_at, agora) && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#16224f] bg-[#e5484d] motion-safe:animate-pulse" aria-hidden="true" />
        )}
      </span>
    );
    titulo = nome;
    linha = `${agora !== null ? timeAgo(post.created_at, agora) : ""} · ${rotulo}`;
    toque = () => onAbrirPost(post.id);
    rotuloToque = `${nome}, ${agora !== null ? timeAgo(post.created_at, agora) : ""}. Ver o post. ${rotulo}`;
  } else if (aviso && !carregando) {
    // o aviso que ainda vai começar: avisa antes, quando o mapa está quieto
    titulo = <span style={{ color: corAviso }}>{aviso.kind}</span>;
    linha = agora !== null ? `a caminho · ${comeco(aviso.starts_at, agora)}` : "a caminho";
    corLinha = corAviso;
    toque = onAviso;
    rotuloToque = `${aviso.kind} a caminho, ${janela(aviso)}. Ver o aviso do INMET`;
  } else {
    titulo = carregando ? "Olhando a cidade" : "Tudo calmo";
    linha = rotulo;
  }

  const pulso = (
    <span key={post?.id ?? (aviso ? "aviso" : dia ?? (carregando ? "carregando" : "calmo"))} className="pulso-entra flex min-w-0 items-center gap-2.5">
      {icone}
      <span className="flex min-w-0 flex-col items-start gap-[3px] leading-none">
        <span className="max-w-full truncate text-[16px] font-bold">{titulo}</span>
        <span className="max-w-full truncate text-[13px] font-bold" style={{ color: corLinha }}>
          {linha}
        </span>
      </span>
    </span>
  );

  return (
    <>
      {/* o véu: o alto do mapa escurece atrás da pílula */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[9] h-[calc(env(safe-area-inset-top)+11rem)] bg-[linear-gradient(180deg,rgba(4,8,24,0.92)_0%,rgba(4,8,24,0.6)_55%,rgba(4,8,24,0)_100%)] light:bg-[linear-gradient(180deg,rgba(26,60,160,0.38)_0%,rgba(26,60,160,0.14)_55%,rgba(26,60,160,0)_100%)]"
        aria-hidden="true"
      />
      <div
        ref={ref}
        className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-col items-center gap-3"
      >
        <div className="sala-escura flex h-[66px] w-[min(26rem,calc(100vw-1.5rem))] max-w-full items-center gap-3 rounded-full border-[1.5px] border-luz/60 bg-[linear-gradient(180deg,#23336e,#0f1a44)] pl-5 pr-2.5 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_0_5px_rgba(255,210,122,0.09),0_16px_34px_rgba(0,0,0,0.55)] light:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_0_5px_rgba(255,210,122,0.14),0_16px_34px_rgba(16,40,110,0.4)]">
          <span className="flex shrink-0 items-center gap-2">
            <Mark size={32} />
            <span className="font-display text-[25px] font-medium leading-none tracking-tight">viu</span>
          </span>
          <span className="h-[30px] w-px shrink-0 bg-white/20" aria-hidden="true" />
          {toque ? (
            <button type="button" onClick={toque} aria-label={rotuloToque} className="flex min-w-0 items-center text-left">
              {pulso}
            </button>
          ) : (
            <span className="flex min-w-0 items-center" aria-live="polite">
              {pulso}
            </span>
          )}
          <button
            type="button"
            onClick={onAlertas}
            aria-label="Alertas perto de você"
            className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-ink transition hover:bg-white/15"
          >
            <BellIcon width="20" height="20" />
          </button>
          {conta}
        </div>
        {children}
      </div>
    </>
  );
}

// O chip dos filtros, no mesmo acabamento da pílula: escuro nos dois temas,
// o escolhido com o contorno da luz
export function ChipTopo({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] bg-[#0f1a44] px-4 text-sm transition",
        "shadow-[0_6px_16px_rgba(0,0,0,0.45)] light:shadow-[0_6px_16px_rgba(16,40,110,0.3)]",
        active ? "border-[#ffd27a]/70 font-bold text-white" : "border-white/15 font-semibold text-[#c4cbe8] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

// A conta é o seu Olheiro num círculo da luz, com o anel de XP até o próximo
// nível. Sem login, o mesmo círculo com o ícone de pessoa.
export function BotaoConta({ progress, onClick }: { progress: Progress | null; onClick: () => void }) {
  const frac = progress ? levelProgress(progress.xp).frac : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={progress ? `Minha conta · nível ${progress.level}, ${levelName(progress.level)}` : "Minha conta"}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full"
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0" aria-hidden="true">
        <circle cx="22" cy="22" r="22" fill="#ffd27a" />
        {progress && (
          <>
            <circle cx="22" cy="22" r="19.5" fill="none" stroke="#0a1230" strokeOpacity="0.15" strokeWidth="3" />
            <circle
              cx="22"
              cy="22"
              r="19.5"
              fill="none"
              stroke="#0a1230"
              strokeWidth="3"
              pathLength={100}
              strokeDasharray={`${Math.max(2, frac * 100)} 100`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          </>
        )}
      </svg>
      {progress ? (
        <Olheiro nivel={progress.level - 1} tam={20} className="relative -mt-1" />
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0a1230" strokeWidth="2" strokeLinecap="round" className="relative" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )}
    </button>
  );
}
