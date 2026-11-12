import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import type { Theme } from "@/lib/theme";

// Três tipos de mapa. O mapa não segue a paleta da interface: ele é feito
// para ser lido de relance (ruas bem separadas do chão, água azul, parque
// verde), e a interface continua pedra e areia por cima dele.
//
//  padrao    positron do OpenFreeMap repintado camada a camada: "noturno" no
//            tema escuro, "dia" no claro
//  colorido  liberty do OpenFreeMap como vem (familiar, com comércios)
//  satelite  imagem do Esri World Imagery + nomes de ruas e bairros por cima

export type MapType = "padrao" | "colorido" | "satelite";

export const MAP_TYPES: { id: MapType; label: string; hint: string }[] = [
  { id: "padrao", label: "Padrão", hint: "Limpo, a foto em destaque" },
  { id: "colorido", label: "Colorido", hint: "Com comércios e pontos" },
  { id: "satelite", label: "Satélite", hint: "Imagem aérea com nomes" },
];

const POSITRON = process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/positron";
const LIBERTY = "https://tiles.openfreemap.org/styles/liberty";
// Esri World Imagery: livre para testar. Em produção, use uma chave gratuita
// do ArcGIS Location Platform (ou MapTiler) e troque a URL pela variável.
export const SATELLITE_TILES =
  process.env.NEXT_PUBLIC_SATELLITE_TILES ??
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

type Role =
  | "land" | "residential" | "park" | "wood" | "ice" | "water" | "waterway"
  | "building" | "buildingLine" | "path" | "minor" | "minorCasing" | "majorCasing" | "major" | "majorSubtle"
  | "motorwayCasing" | "motorway" | "motorwaySubtle" | "rail" | "railDash" | "boundary" | "aeroway"
  | "label" | "labelMinor" | "roadLabel" | "waterLabel" | "halo";

// Redesign "Noite": o mapa noturno é o mesmo céu azul-marinho da interface,
// com as ruas em azul mais claro; o diurno é o céu de dia, frio e claro.
const NOTURNO: Record<Role, string> = {
  land: "#0b1433",
  residential: "#0e183b",
  park: "#0f2b3a",
  wood: "#10303c",
  ice: "#18234a",
  water: "#0f2f63",
  waterway: "#25539a",
  building: "#16224d",
  buildingLine: "#1f2d5e",
  path: "#1e2c5c",
  minor: "#26386f",
  minorCasing: "#0b1433",
  majorCasing: "#070e28",
  major: "#3a4f8f",
  majorSubtle: "#2c3f78",
  // A rodovia tem a cor das outras ruas; a largura já basta para destacá-la
  motorwayCasing: "#070e28",
  motorway: "#3a4f8f",
  motorwaySubtle: "#2c3f78",
  rail: "#2c3d73",
  railDash: "#0b1433",
  boundary: "#5b6fae",
  aeroway: "#1e2c5c",
  label: "#e8ecff",
  labelMinor: "#b7c1e6",
  roadLabel: "#a9b4dc",
  waterLabel: "#8fb6f0",
  halo: "#070d24",
};

const DIA: Record<Role, string> = {
  land: "#eef2fb",
  residential: "#e6ecf8",
  park: "#d3ecdf",
  wood: "#c6e4d4",
  ice: "#ffffff",
  water: "#a9c8f0",
  waterway: "#8fb6ea",
  building: "#dde4f3",
  buildingLine: "#cbd5ec",
  path: "#dbe2f2",
  minor: "#ffffff",
  minorCasing: "#d3dbee",
  majorCasing: "#c3cde6",
  major: "#ffffff",
  majorSubtle: "#e2e8f6",
  motorwayCasing: "#c3cde6",
  motorway: "#ffffff",
  motorwaySubtle: "#e2e8f6",
  rail: "#c3cde6",
  railDash: "#eef2fb",
  boundary: "#8e9cc6",
  aeroway: "#dbe2f2",
  label: "#1d2850",
  labelMinor: "#46527a",
  roadLabel: "#4f5b80",
  waterLabel: "#2f5fa8",
  halo: "#ffffff",
};

const SATELITE_TEXTO: Partial<Record<Role, string>> = {
  label: "#ffffff",
  labelMinor: "#f1f1f1",
  roadLabel: "#f5f5f5",
  waterLabel: "#cfe8f7",
  halo: "rgba(0,0,0,0.78)",
};

function roleOf(id: string): Role | null {
  if (id === "background" || id.startsWith("road_area_pier") || id === "road_pier") return "land";
  if (id === "park") return "park";
  if (id === "water") return "water";
  if (id.startsWith("landcover_ice") || id.startsWith("landcover_glacier")) return "ice";
  if (id === "landuse_residential") return "residential";
  if (id === "landcover_wood") return "wood";
  if (id === "waterway") return "waterway";
  if (id === "building") return "building";
  if (id.startsWith("aeroway")) return "aeroway";
  if (id === "highway_path") return "path";
  if (id === "highway_minor") return "minor";
  if (id === "highway_major_casing") return "majorCasing";
  if (id === "highway_major_inner") return "major";
  if (id === "highway_major_subtle") return "majorSubtle";
  if (id.includes("motorway") && id.includes("casing")) return "motorwayCasing";
  if (id.includes("motorway") && id.includes("subtle")) return "motorwaySubtle";
  if (id.includes("motorway")) return "motorway";
  if (id.startsWith("railway") && id.endsWith("dashline")) return "railDash";
  if (id.startsWith("railway")) return "rail";
  if (id.startsWith("boundary")) return "boundary";
  if (id.startsWith("water") && id.includes("label")) return "waterLabel";
  if (id.startsWith("highway-name") || id.includes("shield")) return "roadLabel";
  if (id === "airport" || id === "label_other" || id === "label_village") return "labelMinor";
  if (id.startsWith("label_")) return "label";
  return null;
}

// Multiplica as larguras de uma expressão interpolate por zoom (não dá para
// embrulhar em ["*"]: zoom só pode ficar no topo da expressão)
function scaleWidth(w: unknown, k: number): unknown {
  if (typeof w === "number") return w * k;
  if (Array.isArray(w) && w[0] === "interpolate") {
    return w.map((v, i) => (i >= 3 && i % 2 === 0 && typeof v === "number" ? v * k : v));
  }
  return w;
}

const cache = new Map<string, Promise<StyleSpecification>>();
function load(url: string) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.json()));
  return cache.get(url)!.then((s) => structuredClone(s));
}

function paintPositron(base: StyleSpecification, pal: Record<Role, string>, withMinorCasing: boolean) {
  const layers: LayerSpecification[] = [];
  for (const layer of base.layers) {
    const role = roleOf(layer.id);
    const l = layer as LayerSpecification & { paint?: Record<string, unknown> };
    if (layer.type === "raster") {
      // relevo sombreado do Natural Earth: só distrai numa cidade
      continue;
    }
    const paint = (l.paint ??= {});
    if (role) {
      if (layer.type === "background") paint["background-color"] = pal[role];
      if (layer.type === "fill") {
        paint["fill-color"] = pal[role];
        if (role === "building") paint["fill-outline-color"] = pal.buildingLine;
      }
      if (layer.type === "line") paint["line-color"] = pal[role];
      if (layer.type === "symbol") {
        paint["text-color"] = pal[role];
        paint["text-halo-color"] = pal.halo;
        paint["text-halo-width"] = 1.4;
      }
    }
    if (layer.id === "highway_minor") {
      paint["line-width"] = scaleWidth(paint["line-width"], 1.3);
      if (withMinorCasing) {
        // No claro, rua branca sobre papel some: um contorno por baixo a separa
        layers.push({
          ...(structuredClone(l) as LayerSpecification),
          id: "highway_minor_casing",
          paint: { "line-color": pal.minorCasing, "line-width": scaleWidth(paint["line-width"], 1.45) },
        } as LayerSpecification);
      }
    }
    if (layer.id === "highway_major_inner" || layer.id === "highway_major_casing") {
      paint["line-width"] = scaleWidth(paint["line-width"], 1.15);
    }
    layers.push(l);
  }
  base.layers = layers;
  return base;
}

// No colorido, rodovias e avenidas vêm em amarelo e laranja: ficam brancas
// com o mesmo contorno das ruas comuns
function neutralRoads(style: StyleSpecification) {
  for (const layer of style.layers) {
    if (layer.type !== "line" || !/^(road|tunnel|bridge)_/.test(layer.id) || /rail|path|pedestrian/.test(layer.id)) continue;
    const paint = ((layer as { paint?: Record<string, unknown> }).paint ??= {});
    paint["line-color"] = layer.id.endsWith("_casing") ? "#cfcdca" : "#ffffff";
  }
  return style;
}

export async function buildMapStyle(theme: Theme, type: MapType): Promise<StyleSpecification> {
  if (type === "colorido") return neutralRoads(await load(LIBERTY));

  const base = await load(POSITRON);
  if (type === "padrao") return paintPositron(base, theme === "dark" ? NOTURNO : DIA, theme === "light");

  // Satélite: a imagem por baixo e só os textos do positron por cima
  const pal = { ...NOTURNO, ...SATELITE_TEXTO } as Record<Role, string>;
  const labels = paintPositron(base, pal, false).layers.filter((l) => l.type === "symbol");
  return {
    ...base,
    sources: {
      ...base.sources,
      satelite: {
        type: "raster",
        tiles: [SATELLITE_TILES],
        tileSize: 256,
        // Em Itapetininga a Esri só tem imagem até o z18; no z19 ela devolve
        // o ladrilho "Map data not yet available". Acima disso, amplia o z18.
        maxzoom: 18,
        attribution: "Imagens © Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [{ id: "satelite", type: "raster", source: "satelite" }, ...labels],
  };
}

// Se o mapa desenhado é escuro ou claro (decide a cor da máscara fora da cidade)
export const mapTone = (theme: Theme, type: MapType): "dark" | "light" =>
  type === "satelite" ? "dark" : type === "colorido" ? "light" : theme;
