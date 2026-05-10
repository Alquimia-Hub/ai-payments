import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

import { opBNBMainnet, opBNBTestnet } from "@/lib/opbnb";

/** Wagmi enfocada en opBNB (mainnet/testnet); transportes usan URLs de `lib/opbnb`. */
export const wagmiConfig = createConfig({
  chains: [opBNBMainnet, opBNBTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [opBNBMainnet.id]: http(opBNBMainnet.rpcUrls.default.http[0]),
    [opBNBTestnet.id]: http(opBNBTestnet.rpcUrls.default.http[0]),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
