// Tipografia do redesign "Noite" (11/11/2026), a mesma do app: Outfit nos títulos, Manrope no corpo e JetBrains
// Mono nos números (copiadas para public/gerado por scripts/preparar.mjs).
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const TITULO = 'Outfit Viu';
export const CORPO = 'Manrope Viu';
export const MONO = 'JetBrains Mono Viu';

loadFont({ family: TITULO, url: staticFile('gerado/fontes/outfit-latin.woff2'), weight: '300 700' });
loadFont({ family: CORPO, url: staticFile('gerado/fontes/manrope-latin.woff2'), weight: '400 800' });
loadFont({ family: MONO, url: staticFile('gerado/fontes/jetbrains-mono-latin.woff2'), weight: '400 500' });
