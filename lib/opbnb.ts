import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  isAddress,
  type PublicClient,
  type WalletClient,
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

/** Alias explícito del chain id testnet opBNB. */
export const OPBNB_TESTNET_CHAIN_ID = opBNBTestnet.id;

/**
 * USDT “bridged” citado habitualmente para opBNB testnet.
 * Confirmar antes de producción en testnet.opbnbscan.com o bnb-chain/opbnb-bridge-tokens.
 */
export const DEFAULT_USDT_ADDRESS_OPBNB_TESTNET =
  "0xCF712f20c85421d00EAa1B6F6545AaEEb4492B75";

/** Dirección USDT en opBNB testnet: env `NEXT_PUBLIC_USDT_ADDRESS_OPBNB_TESTNET` o valor por defecto documentado. */
export function getUsdtAddressOpbnbTestnet(): `0x${string}` {
  const raw = process.env.NEXT_PUBLIC_USDT_ADDRESS_OPBNB_TESTNET?.trim();
  if (raw?.length && isAddress(raw)) {
    return getAddress(raw);
  }
  return getAddress(DEFAULT_USDT_ADDRESS_OPBNB_TESTNET);
}

function normalizeAgentPrivateKey(secret: string): `0x${string}` {
  const t = secret.trim();
  if (!t.startsWith("0x")) return `0x${t}`;
  return t as `0x${string}`;
}

/**
 * Cuenta servidor para firmar en opBNB testnet. Requiere `AGENT_WALLET_PRIVATE_KEY`; nunca público (`NEXT_PUBLIC_`).
 * Devuelve `null` si falta la variable o la clave es inválida.
 */
export function getAgentAccount() {
  const pk = process.env.AGENT_WALLET_PRIVATE_KEY?.trim();
  if (!pk?.length) return null;
  try {
    return privateKeyToAccount(normalizeAgentPrivateKey(pk));
  } catch {
    return null;
  }
}

let cachedAgentWalletClient: WalletClient | null | undefined;

/** Cliente de escritura opcional contra opBNB testnet usando la cuenta agente. */
export function getAgentWalletClientOpbnbTestnet(): WalletClient | null {
  if (cachedAgentWalletClient === undefined) {
    const account = getAgentAccount();
    cachedAgentWalletClient = account
      ? createWalletClient({
          account,
          chain: opBNBTestnet,
          transport: http(testnetHttpUrl(), { batch: true }),
        })
      : null;
  }
  return cachedAgentWalletClient;
}

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
