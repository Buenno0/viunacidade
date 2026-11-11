import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import { themeBootScript } from "@/lib/theme";
import { tema } from "@/design/tokens.mjs";
import "./globals.css";

// Fontes servidas pelo próprio app, sem requisição a terceiros.
//
// Anton é o título de cartaz e Instrument Serif é a legenda: as duas vieram no
// redesign "mural da cidade", que troca o rótulo mono em caixa alta por uma
// linha em serifa itálica. O corpo segue na pilha do sistema, de propósito:
// uma terceira família baixada custaria mais do que entrega.
//
// A mono fica: ela é o número (relógio, contagem, GPS) e o rótulo das telas
// internas. A Archivo saiu quando o --font-display passou a apontar para a
// Anton: duas famílias de título seriam duas vozes.
//
// Só três arquivos, e um deles sem preload. A medição da LP mostrou 46 KB
// descendo à toa em toda visita: a Instrument Serif reta nunca pintava (as
// três classes de serifa são itálicas) e a mono descia inteira para servir
// umas vinte figuras. A reta saiu do projeto; a mono perdeu o preload e a LP
// deixou de usá-la, então ela só desce quando o app desenha um número.
const cartaz = localFont({
  src: "./fonts/anton-latin.woff2",
  weight: "400",
  variable: "--fonte-cartaz",
  display: "swap",
});
const serifa = localFont({
  // Só a itálica: toda legenda do projeto é itálica, e a reta descia sem
  // nunca pintar. O `style` é obrigatório aqui, senão o navegador inclina
  // de novo uma face que já vem inclinada.
  src: [{ path: "./fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" }],
  variable: "--fonte-serifa",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "400 500",
  variable: "--fonte-mono",
  display: "swap",
  // Sem preload: a LP não usa mono nenhuma, e quem usa é o app, que a baixa
  // na hora de desenhar o primeiro número. O swap cobre esse instante.
  preload: false,
});

export const metadata: Metadata = {
  // Links absolutos nas prévias (og:image) precisam da origem pública do app
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Viu na Cidade",
  description: "O que está acontecendo agora em Itapetininga, em fotos que somem do mapa em até 12h.",
  appleWebApp: { capable: true, title: "Viu", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: tema.escuro.bg,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // A classe do tema entra pelo script antes da hidratação
    <html lang="pt-BR" className={`${cartaz.variable} ${serifa.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
