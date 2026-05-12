import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chat agente · tBNB testnet",
  description:
    "Chat streaming con herramientas sendTBnb y checkTBnbBalance en opBNB testnet.",
};

export default function AgentesChatLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
