import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { opBNBMainnet, opBNBTestnet } from "@/lib/opbnb";

/**
 * Config alineada con la guía SSR de wagmi (Context7: `site/react/guides/ssr.md`):
 * - `ssr: true` + `cookieStorage`: evita carreras con `Hydrate` y persiste sesión servidor/cliente.
 * - `multiInjectedProviderDiscovery: false`: no añade conectores EIP-6963 extra (Brave, etc.).
 * - `injected({ target: "metaMask" })`: patrón recomendado frente al conector legacy; usa el provider
 *   MetaMask real sin `@metamask/connect-evm` (menos ruido / `Failed to fetch` del SDK).
 */
export const wagmiConfig = createConfig({
  chains: [opBNBMainnet, opBNBTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  multiInjectedProviderDiscovery: false,
  connectors: [
    injected({
      target: "metaMask",
      shimDisconnect: true,
    }),
  ],
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
