// Cartão final: o contorno tracejado vira a marca (o pino-olho do redesign "Noite"), o wordmark "viu", a frase, o
// link e o QR. Créditos discretos embaixo.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Marca } from '../componentes/Marca';
import { QR } from '../componentes/QR';
import { TITULO, MONO } from '../fontes';
import { cl, outBack, outCubic } from '../miniatura/iso';
import { COR } from '../tema';
import { Cartela } from './comum';

export const Final: React.FC<{ t: number; vertical?: boolean }> = ({ t, vertical = false }) => {
  const contorno = cl(t / 0.6);
  const enche = outCubic(cl((t - 0.5) / 0.7));
  const pino = outBack(cl((t - 1.1) / 0.52));
  const halo = cl((t - 1.1) / 0.9);
  const resto = (de: number) => ({ opacity: cl((t - de) / 0.4), transform: `translateY(${((1 - outCubic(cl((t - de) / 0.5))) * 16).toFixed(1)}px)` });
  if (vertical) {
    // 9:16: tudo centralizado e dentro da zona segura do Reels (sem nada nos 250 px de cima nem abaixo de 1490)
    return (
      <AbsoluteFill style={{ background: COR.bg }}>
        <div style={{ position: 'absolute', left: 390, top: 290, width: 300, height: 360 }}>
          <Marca largura={300} preenchimento={enche} pino={pino} tracejado={contorno * (1 - enche * 0.6)} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: TITULO, fontWeight: 500, fontSize: 150, lineHeight: 0.9, letterSpacing: '-0.04em', color: COR.ink, ...resto(1.0) }}>viu</div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase', color: COR.muted, marginTop: 20, ...resto(1.2) }}>na cidade · Itapetininga · SP</div>
          <div style={{ marginTop: 36 }}>
            <Cartela texto={"O que está rolando agora\nem Itapetininga."} t={t} de={1.5} tamanho={48} peso={600} style={{ textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 44, ...resto(2.1) }}>
            <QR tamanho={170} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 38, color: COR.accent }}>viunacidade.com.br</div>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: COR.muted, marginTop: 12 }}>Sem baixar nada</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 1400, textAlign: 'center', fontFamily: MONO, fontSize: 18, lineHeight: 1.5, color: COR.muted, ...resto(2.6) }}>
          Imagens ilustrativas · Mapa nas telas: OpenFreeMap © OpenMapTiles<br />© colaboradores do OpenStreetMap
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: COR.bg }}>
      <div style={{ position: 'absolute', left: 320, top: 270, width: 400, height: 480 }}>
        <Marca largura={400} preenchimento={enche} pino={pino} tracejado={contorno * (1 - enche * 0.6)} />
        {halo > 0 && halo < 1 && (
          <div style={{
            position: 'absolute', left: 400 * 0.5 - 40 - 4, top: 480 * (46 / 120) - 40 - 4, width: 80, height: 80, borderRadius: 50,
            border: `4px solid ${COR.accent}`, transform: `scale(${(1 + 3 * halo).toFixed(3)})`, opacity: 0.9 * (1 - halo),
          }} />
        )}
      </div>
      <div style={{ position: 'absolute', left: 880, top: 300, width: 900 }}>
        <div style={{ fontFamily: TITULO, fontWeight: 500, fontSize: 176, lineHeight: 0.9, letterSpacing: '-0.04em', color: COR.ink, ...resto(1.0) }}>viu</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, letterSpacing: '0.16em', textTransform: 'uppercase', color: COR.muted, marginTop: 22, ...resto(1.2) }}>na cidade · Itapetininga · SP</div>
        <div style={{ marginTop: 44 }}>
          <Cartela texto={"O que está rolando agora\nem Itapetininga."} t={t} de={1.5} tamanho={50} peso={600} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, marginTop: 52, ...resto(2.1) }}>
          <QR tamanho={196} />
          <div>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 46, color: COR.accent }}>viunacidade.com.br</div>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: '0.12em', textTransform: 'uppercase', color: COR.muted, marginTop: 14 }}>Abra no celular · sem baixar nada</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 46, textAlign: 'center', fontFamily: MONO, fontSize: 20, color: COR.muted, letterSpacing: '0.04em', ...resto(2.6) }}>
        Imagens ilustrativas · Mapa nas telas: OpenFreeMap © OpenMapTiles · © colaboradores do OpenStreetMap
      </div>
    </AbsoluteFill>
  );
};
