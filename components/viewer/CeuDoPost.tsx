import { useId } from "react";
import { coresDoCeu, noiteEm } from "@/lib/ceu";

// O céu da hora em que a foto foi tirada (V3 do canvas "Viu: o app na Noite"):
// um recorte do céu da LP naquela hora, com o sol ou a lua e a cidade embaixo,
// ao lado do horário no story. Usado no app (PostViewer) e na LP (StoryDemo).
export default function CeuDoPost({ hora }: { hora: number }) {
  const id = `ceu-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [c0, c1, c2, c3] = coresDoCeu(hora);
  const noite = noiteEm(hora) > 0.5;
  const t = noite ? ((hora + 24 - 19) % 24) / 10.5 : (hora - 5.5) / 13.5;
  const x = 6 + 26 * Math.min(1, Math.max(0, t));
  return (
    <svg viewBox="0 0 40 24" width="40" height="24" className="shrink-0 overflow-hidden rounded-md" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="0.45" stopColor={c1} />
          <stop offset="0.8" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
      </defs>
      <rect width="40" height="24" fill={`url(#${id})`} />
      <circle cx={x} cy="13" r="4.5" fill={noite ? "#f6f1dc" : "#fff6d8"} />
      {noite && <circle cx={x - 2} cy="11.5" r="4" fill={c1} />}
      <path d="M0 24V19h5v-3h6v3h4v-5h5v5h5v-2h6v2h4v-4h5v9z" fill="#0a1638" />
    </svg>
  );
}
