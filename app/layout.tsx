import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { AppShell } from "@/components/shell/app-shell";
import { Web3Providers } from "@/components/providers/web3-providers";

/** Debe coincidir con `@theme --font-sans` en `globals.css` (`var(--font-inter), …`). */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Agent Pay Demos · opBNB",
    template: "%s · Agent Pay Demos",
  },
  description:
    "Demos de pagos autónomos con agentes de IA en la red opBNB (Next.js · wagmi · Vercel AI SDK).",
  applicationName: "Agent Pay Demos",
};

export const viewport: Viewport = {
  themeColor: "#0c0e12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-svh touch-manipulation font-sans bg-background antialiased selection:bg-[#f0b90b]/30 selection:text-[#f4f6fa]">
        <Web3Providers>
          <AppShell>{children}</AppShell>
        </Web3Providers>
      </body>
    </html>
  );
}
