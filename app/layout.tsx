import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Manrope, Outfit } from "next/font/google";
import Providers from "@/components/Providers";
import { themeBootScript } from "@/lib/theme";
import { tema } from "@/design/tokens.mjs";
import "./globals.css";

// Fontes servidas pelo próprio app, sem requisição a terceiros: o next/font
// baixa as do Google no build e serve do nosso domínio.
//
// Redesign "Noite": Outfit no título (leve e larga, a voz da marca) e Manrope
// no corpo e no cromo. A Anton e a Instrument Serif do mural saíram.
// A mono fica para o número do app (relógio, contagem, GPS), sem preload.
const titulo = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--fonte-titulo",
  display: "swap",
});
const corpo = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--fonte-corpo",
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
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
