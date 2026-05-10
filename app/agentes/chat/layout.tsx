import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chat agente · USDT testnet",
  description:
    "Chat streaming con herramientas sendUSDT y checkUSDTBalance en opBNB testnet.",
};

export default function AgentesChatLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
