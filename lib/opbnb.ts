import {
  createPublicClient,
  defineChain,
  http,
  type PublicClient,
} from "viem";

/** Public RPC for opBNB mainnet — override via NEXT_PUBLIC_OPBNB_RPC_MAINNET. */
function mainnetHttpUrl() {
  return (
    process.env.NEXT_PUBLIC_OPBNB_RPC_MAINNET ??
    "https://opbnb-mainnet-rpc.bnbchain.org"
  );
}

/** Public RPC for opBNB testnet — override via NEXT_PUBLIC_OPBNB_RPC_TESTNET. */
function testnetHttpUrl() {
  return (
    process.env.NEXT_PUBLIC_OPBNB_RPC_TESTNET ??
    "https://opbnb-testnet-rpc.bnbchain.org"
  );
}

/** opBNB mainnet (chain id 204). */
export const opBNBMainnet = defineChain({
  id: 204,
  name: "opBNB Mainnet",
  nativeCurrency: { decimals: 18, name: "BNB", symbol: "BNB" },
  rpcUrls: { default: { http: [mainnetHttpUrl()] } },
  blockExplorers: {
    default: { name: "opBNBScan", url: "https://opbnbscan.com" },
  },
});

/** opBNB testnet (chain id 5611). */
export const opBNBTestnet = defineChain({
  id: 5611,
  name: "opBNB Testnet",
  nativeCurrency: { decimals: 18, name: "tBNB", symbol: "tBNB" },
  rpcUrls: { default: { http: [testnetHttpUrl()] } },
  blockExplorers: {
    default: {
      name: "opBNBScan Testnet",
      url: "https://testnet.opbnbscan.com",
    },
  },
});

const clientByChain = new Map<number, PublicClient>();

/**
 * Read-only JSON-RPC client for server-side or scripts (no wallet).
 * Cached per chain id for the lifetime of the process.
 */
export function getPublicClient(chainId: number): PublicClient {
  const chain =
    chainId === opBNBMainnet.id
      ? opBNBMainnet
      : chainId === opBNBTestnet.id
        ? opBNBTestnet
        : null;
  if (!chain) {
    throw new Error(`Unsupported opBNB chainId: ${chainId}`);
  }

  let client = clientByChain.get(chainId);
  if (!client) {
    const url = chain.rpcUrls.default.http[0];
    client = createPublicClient({
      chain,
      transport: http(url, { batch: true }),
    });
    clientByChain.set(chainId, client);
  }
  return client;
}

/**
 * Link to a transaction on the configured explorer.
 * `NEXT_PUBLIC_EXPLORER_TX_URL_TEMPLATE` may include `{{hash}}` or `%s`.
 */
export function exploreTxUrl(
  txHash: string,
  chainId: number = opBNBMainnet.id,
): string {
  const tpl = process.env.NEXT_PUBLIC_EXPLORER_TX_URL_TEMPLATE;
  if (tpl?.length) {
    return tpl.replaceAll("{{hash}}", txHash).replaceAll("%s", txHash);
  }
  const base =
    chainId === opBNBTestnet.id
      ? "https://testnet.opbnbscan.com"
      : "https://opbnbscan.com";
  return `${base}/tx/${txHash}`;
}
