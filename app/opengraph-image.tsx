import { ImageResponse } from "next/og";
import { CITY } from "@/lib/city";
import { marcaSvg } from "@/components/ui/Mark";

// A prévia da LP (e das páginas sem prévia própria) no WhatsApp e no Google
export const alt = `Viu na Cidade: o que está acontecendo em ${CITY.name} agora`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#ffd27a"; // a luz da janela acesa (redesign Noite)
const BASALT = "#0a1230"; // o céu de noite
const INK = "#f3f5ff";
const MUTED = "#a9b3d9";

const markSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">${marcaSvg()}</svg>`,
)}`;

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: BASALT, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={markSvg} width={52} height={63} alt="" />
          <div style={{ display: "flex", fontSize: 26, color: MUTED, letterSpacing: 4 }}>{`${CITY.name.toUpperCase()} · ${CITY.uf} · AO VIVO`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.02, letterSpacing: -2, fontWeight: 700 }}>
          <div style={{ display: "flex" }}>
            Viu?&nbsp;<span style={{ color: GOLD }}>Posta.</span>
          </div>
          <div style={{ display: "flex" }}>{`${CITY.name} inteira`}</div>
          <div style={{ display: "flex" }}>fica sabendo.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: MUTED }}>Fotos de agora no mapa da cidade. Anônimo, grátis, e some em até 12h.</div>
      </div>
    ),
    size,
  );
}
