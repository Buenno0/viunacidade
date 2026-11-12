import Mark from "@/components/ui/Mark";
import { Tag } from "@/components/ui/Tag";
import { FloodScene } from "./scenes";
import { useT } from "./lang";

// Alertas por área, na linha do vídeo do BeReal: tela de bloqueio parada, o
// alerta salta maior que o celular e assenta, um toque nele e a tela vira o
// story enquanto o celular gira. Só CSS (ciclo de 9 s em app/landing.css);
// parado até a seção entrar na tela (.lp-rv/.lp-in).
export default function AlertPhone() {
  const { phone: t, tags } = useT();
  return (
    <div className="lp-al-cena" aria-hidden="true">
      <div className="lp-al-fone">
        {/* tela de bloqueio */}
        <div className="lp-al-bloqueio">
          <svg viewBox="0 0 300 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
            {/* papel de parede: a cidade à noite, como o céu da LP */}
            <defs>
              <linearGradient id="lpAlCeu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#050a1e" />
                <stop offset="0.62" stopColor="#13265f" />
                <stop offset="1" stopColor="#3d63c4" />
              </linearGradient>
            </defs>
            <rect width="300" height="600" fill="url(#lpAlCeu)" />
            <g fill="#fff">
              <circle cx="40" cy="70" r="1.2" opacity="0.7" /><circle cx="250" cy="60" r="1" opacity="0.6" /><circle cx="90" cy="230" r="1.1" opacity="0.5" />
              <circle cx="200" cy="300" r="1" opacity="0.5" /><circle cx="270" cy="250" r="1.3" opacity="0.7" /><circle cx="30" cy="330" r="1" opacity="0.5" />
            </g>
            <circle cx="232" cy="190" r="17" fill="#f6f1dc" />
            <circle cx="232" cy="190" r="40" fill="#a0b6ff" opacity="0.12" />
            <path d="M-10 600V500h40v-30h36v44h30v-70h12v-26h8v26h12v40h44v-20h30v-46h28v66h34v-30h46v136Z" fill="#0a1433" />
            <g fill="#ffd27a">
              <rect x="40" y="485" width="6" height="7" /><rect x="76" y="460" width="6" height="7" /><rect x="114" y="452" width="6" height="7" />
              <rect x="114" y="476" width="6" height="7" opacity="0.6" /><rect x="168" y="474" width="6" height="7" /><rect x="214" y="462" width="6" height="7" opacity="0.7" />
              <rect x="252" y="500" width="6" height="7" /><rect x="22" y="520" width="6" height="7" opacity="0.6" />
            </g>
          </svg>
          <div className="relative flex flex-col items-center pt-12 text-center" style={{ color: "#f3f5ff" }}>
            <span className="text-[13px] font-medium opacity-90">{t.date}</span>
            <span className="lp-disp text-[64px] leading-none">18:07</span>
          </div>
          <span className="lp-al-dica">{t.tap}</span>
        </div>

        {/* o que abre: o story do alagamento */}
        <div className="lp-al-story sala-escura">
          <FloodScene className="lp-cena absolute inset-0" vb="40 20 360 360" />
          <div className="story-blur-base" />
          <div className="absolute inset-x-0 top-0 flex gap-1 px-3 pt-3">
            <span className="story-barra"><i className="lp-al-enche" /></span>
            <span className="story-barra" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-4 pb-6 text-ink">
            <span className="flex"><Tag kind="agora" label={tags.agora} /></span>
            <span className="lp-disp text-lg leading-tight">{t.caption}</span>
          </div>
        </div>
      </div>

      {/* a notificação, fora do celular para poder passar das bordas */}
      <div className="lp-al-notif">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: "#0a1230" }}>
          <Mark size={26} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <strong className="flex items-center gap-1 text-[13px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffd27a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20Z M12 10v4 M12 17h.01" /></svg>
              {t.title}
            </strong>
            <span className="text-[11px] opacity-60">{t.now}</span>
          </span>
          <span className="block text-[12.5px] leading-snug opacity-90">{t.body}</span>
        </span>
      </div>
    </div>
  );
}
