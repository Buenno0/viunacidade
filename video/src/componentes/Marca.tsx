// A marca do redesign "Noite" (logo "Pino-olho", design/marca.mjs no app): o pin do mapa com um olho, e o anel em
// volta da pupila é o tempo que esvazia. Pin na luz da janela, olho branco, pupila e anel na tinta da noite.
// Caixa 100×120, a altura sai da largura. Animação do cartão final: `tracejado` desenha o contorno do pin como a
// borda tracejada da cidade, `preenchimento` enche o pin de luz e `pino` (0 a 1) faz o olho abrir.
import React from 'react';
import { COR } from '../tema';

export const PINO_PATH = 'M50 114C40 96 14 76 14 46A36 36 0 1 1 86 46C86 76 60 96 50 114Z';

export const Marca: React.FC<{ largura: number; preenchimento?: number; pino?: number; tracejado?: number }> = ({
  largura, preenchimento = 1, pino = 1, tracejado = 0,
}) => (
  <svg viewBox="0 0 100 120" width={largura} height={largura * 1.2} overflow="visible">
    {tracejado > 0 && (
      <path d={PINO_PATH} fill="none" stroke={COR.accent} strokeWidth={1.4} strokeDasharray="4 3" strokeLinejoin="round" opacity={tracejado} />
    )}
    <path d={PINO_PATH} fill={COR.accent} opacity={preenchimento} />
    <g opacity={Math.min(1, pino * 1.4)} transform={`translate(50 46) scale(${(0.3 + 0.7 * pino).toFixed(3)}) translate(-50 -46)`}>
      <circle cx={50} cy={46} r={22} fill="#ffffff" />
      <circle cx={50} cy={46} r={16.5} fill="none" stroke={COR.accentInk} strokeOpacity={0.12} strokeWidth={5} />
      <circle cx={50} cy={46} r={16.5} fill="none" stroke={COR.accentInk} strokeWidth={5} pathLength={100} strokeDasharray="72 100" strokeLinecap="round" transform="rotate(-90 50 46)" />
      <circle cx={50} cy={46} r={8} fill={COR.accentInk} />
      <circle cx={46.6} cy={42.6} r={2.6} fill="#ffffff" />
    </g>
  </svg>
);
