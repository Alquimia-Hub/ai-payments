import { tool } from "ai";
import { formatEther, getAddress, isAddress, parseEther } from "viem";
import { z } from "zod";

import {
  exploreAddressUrl,
  exploreTxUrl,
  getAgentAccount,
  getAgentPrivateKeyFormatHint,
  getAgentWalletClientOpbnbTestnet,
  getPublicClient,
  opBNBTestnet,
  OPBNB_TESTNET_CHAIN_ID,
} from "@/lib/opbnb";

const NATIVE_DECIMALS = 18;

function parseMaxTbnbFromEnv(): bigint | undefined {
  const raw =
    process.env.AGENT_TBNB_MAX_PER_TX?.trim() ??
    process.env.AGENT_USDT_MAX_PER_TX?.trim(); // compat legado nombre antiguo
  if (!raw?.length) return undefined;
  try {
    return parseEther(raw);
  } catch {
    return undefined;
  }
}

export type AgentFlowLock = "A2A" | "A2B" | "A2C";

/**
 * Herramientas on-chain **tBNB nativo** opBNB testnet. Si `lockedFlow` está definido,
 * `sendTBnb` rechaza otro `flow` (paridad con `/api/agents/demo` mock).
 */
export function createAgentTools(lockedFlow?: AgentFlowLock) {
  const flowSchema = z
    .enum(["A2A", "A2B", "A2C"])
    .describe(
      lockedFlow
        ? `Debe ser ${lockedFlow} en esta página; usar ese valor aunque el ejemplo macro sugiera otro modo.`
        : "Clasificación solicitada por el usuario; no cambia la llamada en cadena.",
    );

  return {
    checkTBnbBalance: tool({
      description:
        "Lee el saldo nativo **tBNB** (Wei internos, muestra también balanceHuman en formato decimal) para una dirección 0x en opBNB testnet.",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe(
            "Dirección 0x. Si se omite, usa la cuenta del servidor cuando exista AGENT_WALLET_PRIVATE_KEY.",
          ),
      }),
      execute: async ({ address }) => {
        const publicClient = getPublicClient(OPBNB_TESTNET_CHAIN_ID);

        let owner: `0x${string}`;
        if (address?.trim().length) {
          if (!isAddress(address.trim())) {
            throw new Error(
              "Dirección `address` no es válida (no es formato 0x de 20 bytes).",
            );
          }
          owner = getAddress(address.trim());
        } else {
          const agent = getAgentAccount();
          if (!agent) {
            const formatHint = getAgentPrivateKeyFormatHint();
            if (formatHint) {
              throw new Error(formatHint);
            }
            throw new Error(
              "Sin dirección ni wallet agente: pasa `address` en la herramienta o definí AGENT_WALLET_PRIVATE_KEY válida en el servidor (reiniciá `pnpm dev` tras cambiar `.env`).",
            );
          }
          owner = agent.address;
        }

        const wei = await publicClient.getBalance({ address: owner });

        return {
          address: owner,
          symbol: "tBNB" as const,
          decimals: NATIVE_DECIMALS,
          balanceWei: wei.toString(),
          balanceHuman: formatEther(wei),
          chainId: OPBNB_TESTNET_CHAIN_ID,
          explorerUrl: exploreAddressUrl(owner, OPBNB_TESTNET_CHAIN_ID),
        };
      },
    }),

    sendTBnb: tool({
      description:
        "Envía **tBNB nativo** en opBNB testnet desde la wallet servidor (AGENT_WALLET_PRIVATE_KEY); el gas también se descuenta de esa misma cuenta. Clasificación A2A/A2B/A2C es sólo etiqueta/registro.",
      inputSchema: z.object({
        to: z.string().describe("Destinatario (opBNB testnet): dirección 0x válida."),
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(
            "Cantidad de tBNB en decimal humano (ej. \"0.01\" — se convierte con 18 decimals).",
          ),
        flow: flowSchema,
      }),
      execute: async ({ to, amountHuman, flow }) => {
        if (lockedFlow !== undefined && flow !== lockedFlow) {
          throw new Error(
            `En esta página el flujo debe ser ${lockedFlow}; pediste ${flow}.`,
          );
        }

        const walletClient = getAgentWalletClientOpbnbTestnet();
        if (!walletClient?.account) {
          const formatHint = getAgentPrivateKeyFormatHint();
          if (formatHint) {
            throw new Error(formatHint);
          }
          throw new Error(
            "Falta AGENT_WALLET_PRIVATE_KEY válida en el servidor: no se pueden firmar transferencias.",
          );
        }

        const trimmedTo = typeof to === "string" ? to.trim() : "";
        if (!trimmedTo || !isAddress(trimmedTo)) {
          throw new Error("Campo `to` debe ser una dirección 0x válida.");
        }

        const amountStr =
          typeof amountHuman === "number"
            ? amountHuman.toString()
            : String(amountHuman).trim();

        let value: bigint;
        try {
          value = parseEther(amountStr);
        } catch {
          throw new Error(
            "amountHuman no es válido como cantidad tBNB (usa número decimal válido).",
          );
        }
        if (value <= BigInt(0)) {
          throw new Error("amountHuman debe ser mayor que cero.");
        }

        const maxWei = parseMaxTbnbFromEnv();
        if (maxWei !== undefined && value > maxWei) {
          const maxHuman =
            process.env.AGENT_TBNB_MAX_PER_TX?.trim() ??
            process.env.AGENT_USDT_MAX_PER_TX;
          throw new Error(
            `Cantidad mayor que AGENT_TBNB_MAX_PER_TX (${maxHuman ?? "?"})`,
          );
        }

        const txHash = await walletClient.sendTransaction({
          to: getAddress(trimmedTo),
          value,
          chain: opBNBTestnet,
          account: walletClient.account,
        });

        return {
          flow,
          txHash,
          explorerUrl: exploreTxUrl(txHash, opBNBTestnet.id),
          from: walletClient.account.address,
          to: getAddress(trimmedTo),
          amountHuman,
          valueWei: value.toString(),
          symbol: "tBNB" as const,
        };
      },
    }),
  };
}

/** Chat sin escenario bloqueado: cualquier flow A2A|A2B|A2C válido. */
export const agentTools = createAgentTools();
