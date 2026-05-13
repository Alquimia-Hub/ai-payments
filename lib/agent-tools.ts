import { tool } from "ai";
import { formatEther, getAddress, isAddress, parseEther } from "viem";
import { z } from "zod";

import { assertAtLeastAgentTbnbMin } from "@/lib/agent-tbnb-amounts";
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

/** Nombre de herramienta para propuesta HITL en UI (`agent-payments-chat`). */
export const AGENT_TOOL_PROPOSE_SEND_TBNB = "proposeSendTBnb" as const;

type ParsedSendTbnbArgs = {
  checksummedTo: `0x${string}`;
  amountStr: string;
  valueWei: bigint;
};

function parseSendTbnbArgs(
  lockedFlow: AgentFlowLock | undefined,
  to: string,
  amountHuman: string | number,
  flow: "A2A" | "A2B" | "A2C",
): ParsedSendTbnbArgs {
  if (lockedFlow !== undefined && flow !== lockedFlow) {
    throw new Error(
      `En esta página el flujo debe ser ${lockedFlow}; pediste ${flow}.`,
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

  let valueWei: bigint;
  try {
    valueWei = parseEther(amountStr);
  } catch {
    throw new Error(
      "amountHuman no es válido como cantidad tBNB (usa número decimal válido).",
    );
  }
  if (valueWei <= BigInt(0)) {
    throw new Error("amountHuman debe ser mayor que cero.");
  }
  assertAtLeastAgentTbnbMin(valueWei, "sendTBnb amountHuman");

  const maxWei = parseMaxTbnbFromEnv();
  if (maxWei !== undefined && valueWei > maxWei) {
    const maxHuman =
      process.env.AGENT_TBNB_MAX_PER_TX?.trim() ??
      process.env.AGENT_USDT_MAX_PER_TX;
    throw new Error(
      `Cantidad mayor que AGENT_TBNB_MAX_PER_TX (${maxHuman ?? "?"})`,
    );
  }

  return {
    checksummedTo: getAddress(trimmedTo),
    amountStr,
    valueWei,
  };
}

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

    proposeSendTBnb: tool({
      description:
        "Propone un envío de **tBNB nativo** desde la tesorería servidor: valida destino, monto y flow, y devuelve estado **awaiting_user_confirmation** para que la persona usuaria apruebe en el modal de la app. **No** firma ni envía en cadena. Solo después de esa confirmación (mensaje explícito del usuario) debe llamarse **sendTBnb** con los mismos `to`, `amountHuman` y `flow`.",
      inputSchema: z.object({
        to: z.string().describe("Destinatario (opBNB testnet): dirección 0x válida."),
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(
            "Cantidad de tBNB en decimal humano (≥ mínimo AGENT_TBNB_MIN_PER_TX, defecto 0.00005).",
          ),
        flow: flowSchema,
        validationSummary: z
          .string()
          .min(1)
          .describe(
            "Resumen breve en español para la pantalla de confirmación (motivo o contexto del envío).",
          ),
      }),
      execute: async ({ to, amountHuman, flow, validationSummary }) => {
        const parsed = parseSendTbnbArgs(lockedFlow, to, amountHuman, flow);
        const agent = getAgentAccount();
        const summary = validationSummary.trim();
        if (!summary.length) {
          throw new Error(
            "validationSummary debe describir el motivo del envío (no puede quedar vacío).",
          );
        }

        return {
          status: "awaiting_user_confirmation" as const,
          flow,
          to: parsed.checksummedTo,
          amountHuman: parsed.amountStr,
          validationSummary: summary,
          fromTreasury: agent?.address ?? null,
          chainId: OPBNB_TESTNET_CHAIN_ID,
          explorerToUrl: exploreAddressUrl(
            parsed.checksummedTo,
            OPBNB_TESTNET_CHAIN_ID,
          ),
        };
      },
    }),

    sendTBnb: tool({
      description:
        "Ejecuta el envío de **tBNB nativo** en opBNB testnet desde la wallet servidor (AGENT_WALLET_PRIVATE_KEY); el gas también se descuenta de esa misma cuenta. Usala **solo** después de que el usuario haya confirmado en el modal (o con mensaje explícito de autorización) la propuesta **proposeSendTBnb** con **exactamente** los mismos `to`, `amountHuman` y `flow`. No la uses para iniciar un pago sin ese paso previo.",
      inputSchema: z.object({
        to: z.string().describe("Destinatario (opBNB testnet): dirección 0x válida."),
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(
            "Cantidad de tBNB en decimal humano (≥ mínimo AGENT_TBNB_MIN_PER_TX, defecto 0.00005).",
          ),
        flow: flowSchema,
      }),
      execute: async ({ to, amountHuman, flow }) => {
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

        const parsed = parseSendTbnbArgs(lockedFlow, to, amountHuman, flow);

        const txHash = await walletClient.sendTransaction({
          to: parsed.checksummedTo,
          value: parsed.valueWei,
          chain: opBNBTestnet,
          account: walletClient.account,
        });

        return {
          flow,
          txHash,
          explorerUrl: exploreTxUrl(txHash, opBNBTestnet.id),
          from: walletClient.account.address,
          to: parsed.checksummedTo,
          amountHuman: parsed.amountStr,
          valueWei: parsed.valueWei.toString(),
          symbol: "tBNB" as const,
        };
      },
    }),
  };
}

/** Chat sin escenario bloqueado: cualquier flow A2A|A2B|A2C válido. */
export const agentTools = createAgentTools();
