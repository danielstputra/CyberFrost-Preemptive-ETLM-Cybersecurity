import type { Metadata } from "next";
import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/providers/translation-provider";
import { BootSplashWrapper } from "@/components/splash/boot-splash-wrapper";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-mono",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost'} — Security Intelligence Platform`,
  description: "Preemptive External Threat Landscape Management",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: '1024x1024' },
    ],
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${orbitron.variable} ${rajdhani.variable} ${shareTechMono.variable}`} suppressHydrationWarning>
      <body>
        <BootSplashWrapper />
        <TooltipProvider>
          <TranslationProvider>{children}</TranslationProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
