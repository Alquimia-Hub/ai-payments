import type { Metadata } from "next";

import { WalletPanel } from "@/components/wallet/wallet-panel";

export const metadata: Metadata = {
  title: "Wallet",
};

export default function WalletPage() {
  return <WalletPanel />;
}
