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

/** Longitud esperada del secreto secp256k1 en hex sin prefijo `0x`. */
export const AGENT_PRIVATE_KEY_HEX_LENGTH = 64;

/**
 * Si existe `AGENT_WALLET_PRIVATE_KEY` pero la cuenta agente no se puede crear, devuelve
 * texto accionable; si falta env o está bien configurada (`getAgentAccount` ok), `null`.
 */
export function getAgentPrivateKeyFormatHint(): string | null {
  const pk = process.env.AGENT_WALLET_PRIVATE_KEY?.trim();
  if (!pk?.length) return null;

  const hex = pk.startsWith("0x") ? pk.slice(2) : pk;
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return "AGENT_WALLET_PRIVATE_KEY debe ser solo dígitos hex (0–9, a–f). Revisá comillas espacios o caracteres raros en el `.env`.";
  }
  if (hex.length !== AGENT_PRIVATE_KEY_HEX_LENGTH) {
    return [
      `AGENT_WALLET_PRIVATE_KEY debe tener exactamente ${AGENT_PRIVATE_KEY_HEX_LENGTH} caracteres hex (clave de 32 bytes), con o sin prefijo 0x.`,
      `Longitud hex actual sin 0x: ${hex.length}. Si exportaste desde MetaMask u otra wallet, suele mostrarse en bloque único largo.`,
      "(No confundir con dirección pública que son 40 hex después de 0x)",
    ].join(" ");
  }
  try {
    privateKeyToAccount(normalizeAgentPrivateKey(pk));
    return null;
  } catch {
    return [
      "AGENT_WALLET_PRIVATE_KEY tiene formato de longitud aceptable pero no es válida como clave privada secp256k1",
      "(fuera del rango criptográfico). Generá/importá otra clave de prueba dedicada.",
    ].join(" ");
  }
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

let cachedWallet: { readonly address: `0x${string}`; readonly client: WalletClient } | null =
  null;

/** Cliente de escritura opcional contra opBNB testnet usando la cuenta agente. */
export function getAgentWalletClientOpbnbTestnet(): WalletClient | null {
  const account = getAgentAccount();
  if (!account) {
    cachedWallet = null;
    return null;
  }
  if (!cachedWallet || cachedWallet.address !== account.address) {
    cachedWallet = {
      address: account.address,
      client: createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(testnetHttpUrl(), { batch: true }),
      }),
    };
  }
  return cachedWallet.client;
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

/**
 * Link a cuenta en el explorador (saldo nativo y transacciones).
 * `NEXT_PUBLIC_EXPLORER_ADDRESS_URL_TEMPLATE` puede incluir `{{address}}` o `%s`.
 */
export function exploreAddressUrl(
  address: `0x${string}`,
  chainId: number = opBNBMainnet.id,
): string {
  const tpl = process.env.NEXT_PUBLIC_EXPLORER_ADDRESS_URL_TEMPLATE;
  if (tpl?.length) {
    return tpl.replaceAll("{{address}}", address).replaceAll("%s", address);
  }
  const base =
    chainId === opBNBTestnet.id
      ? "https://testnet.opbnbscan.com"
      : "https://opbnbscan.com";
  return `${base}/address/${address}`;
}

