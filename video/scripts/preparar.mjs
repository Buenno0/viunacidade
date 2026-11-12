// Copia para public/gerado o que o vídeo usa do app (as fontes da marca, redesign "Noite"). Roda antes do studio, dos quadros e do render.
import { copyFile, mkdir } from 'node:fs/promises';

const RAIZ = new URL('..', import.meta.url).pathname;
const APP = new URL('../..', import.meta.url).pathname;

await mkdir(RAIZ + 'public/gerado/fontes', { recursive: true });
// a mono é a mesma do app; Outfit (títulos) e Manrope (corpo) o app serve pelo next/font, então aqui vêm dos
// pacotes @fontsource-variable (os mesmos desenhos, peso variável)
await copyFile(APP + 'app/fonts/jetbrains-mono-latin.woff2', RAIZ + 'public/gerado/fontes/jetbrains-mono-latin.woff2');
await copyFile(RAIZ + 'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', RAIZ + 'public/gerado/fontes/outfit-latin.woff2');
await copyFile(RAIZ + 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', RAIZ + 'public/gerado/fontes/manrope-latin.woff2');
