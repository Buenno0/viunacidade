"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { photoUrl, thumbUrl } from "@/lib/media";
import type { PostFeature } from "@/lib/posts";
import { EmptyState, cx } from "./ui";
import { CategoryIcon } from "./ui/icons";
import { useDragScroll } from "@/lib/useDragScroll";

export const HISTORY_DAYS = 30;
const TZ = "America/Sao_Paulo";

// "2026-09-29" no fuso da cidade (o dia do histórico é o dia daqui)
export const cityDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const hourFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

export function dayLabel(day: string, today: string) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - date.getTime()) / 864e5);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${weekday.format(date).replace(".", "")} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
export const shortDay = (day: string) => day.slice(8, 10) + "/" + day.slice(5, 7);

// A régua dos 30 dias é um horizonte (V7 do canvas): cada dia é um prédio, a
// altura e as janelas acesas contam o que ficou guardado. Dia vazio fica só o
// contorno tracejado e não dá para tocar.
export function HistoryRuler({
  counts,
  day,
  today,
  onPick,
}: {
  counts: Record<string, number>;
  day: string | null;
  today: string;
  onPick: (day: string) => void;
}) {
  const faixa = useDragScroll();
  const days = useMemo(() => {
    const [y, m, d] = today.split("-").map(Number);
    return Array.from({ length: HISTORY_DAYS }, (_, i) => new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }, [today]);
  return (
    <div ref={faixa} className="no-scrollbar -mx-3 flex select-none items-end gap-1 overflow-x-auto px-3 pb-0.5" role="listbox" aria-label="Dia do histórico">
      {days.map((d) => {
        const n = counts[d] ?? 0;
        const active = d === day;
        const janelas = Math.min(n, 12);
        const linhas = Math.ceil(janelas / 2);
        const alto = n ? 14 + Math.max(1, linhas) * 10 : 12;
        const topo = 90 - alto;
        const corpo = active ? "#ffd27a" : n ? "#1a2756" : "transparent";
        const luz = active ? "#0a1230" : "#ffd27a";
        const rotulo = dayLabel(d, today);
        const [nome, data] = rotulo.includes(" ") ? rotulo.split(" ") : [rotulo, ""];
        return (
          <button
            key={d}
            role="option"
            aria-selected={active}
            aria-label={`${rotulo}, ${n} ${n === 1 ? "guardado" : "guardados"}`}
            disabled={n === 0}
            onClick={() => onPick(d)}
            className="flex w-10 shrink-0 flex-col items-center gap-1 transition active:translate-y-px"
          >
            <svg viewBox="0 0 40 90" width="40" height="90" aria-hidden="true">
              {active && <path d={`M6 ${topo + 1}L20 ${topo - 8}L34 ${topo + 1}Z`} fill={corpo} />}
              <rect
                x="6"
                y={topo}
                width="28"
                height={alto}
                rx="4"
                fill={corpo}
                stroke={n ? "none" : "#2e3f7a"}
                strokeDasharray={n ? undefined : "3 3"}
              />
              {Array.from({ length: janelas }, (_, k) => (
                <rect key={k} x={12 + (k % 2) * 10} y={topo + 8 + Math.floor(k / 2) * 10} width="6" height="6" rx="1.5" fill={luz} />
              ))}
            </svg>
            <span className={cx("text-xs font-bold", active ? "text-luz" : n ? "text-ink" : "text-muted/70")}>{nome}</span>
            <span className={cx("num text-[11px] leading-none", active ? "text-luz" : "text-muted", !n && "opacity-70")}>{data || "\u00a0"}</span>
          </button>
        );
      })}
    </div>
  );
}

// A grade do dia, por hora
export function HistoryList({ posts, onOpen }: { posts: PostFeature[]; onOpen: (id: string, ids: string[]) => void }) {
  const ids = posts.map((f) => f.properties.id);
  if (posts.length === 0) return <EmptyState title="Nada guardado neste dia" />;
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((f) => {
        const p = f.properties;
        return (
          <li key={p.id}>
            <button
              onClick={() => onOpen(p.id, ids)}
              className="sala-escura relative block w-full overflow-hidden rounded-2xl border border-line bg-black text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(p.photo_path)}
                alt={p.caption ?? CATEGORIES[p.category].label}
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    img.src = photoUrl(p.photo_path);
                  }
                }}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-8">
                <span className="etiqueta flex items-center gap-1.5 text-ink">
                  <CategoryIcon category={p.category} width="1.1em" height="1.1em" />
                  <span className="num">{hourFmt.format(new Date(p.created_at))}</span>
                </span>
                {p.caption && <span className="mt-0.5 block truncate text-xs text-ink">{p.caption}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
