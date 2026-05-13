import { tool, type ToolSet } from "ai";
import { formatEther, getAddress, isAddress, parseEther } from "viem";
import { z } from "zod";

import {
  A2A_TESTNET_EXPLORER_BASE,
  parseA2aMaxDemoTbnbHuman,
} from "@/lib/a2a-dual-config";
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

/** Nombre de herramienta UIMessage (tipo `tool-${name}` en parts). Exportado para cliente. */
export const A2A_DUAL_TOOL_PUBLISH_JOB = "publishFreelanceJob";
export const A2A_DUAL_TOOL_SUBMIT_DELIVERABLE = "submitDeliverableAndInvoice";
export const A2A_DUAL_TOOL_PROPOSE_PAYMENT = "proposePaymentSettlement";
export const A2A_DUAL_TOOL_SEND_SETTLEMENT = "sendSettlementTBnb";

function parseMaxTbnbPerTxEnv(): bigint | undefined {
  const raw =
    process.env.AGENT_TBNB_MAX_PER_TX?.trim() ??
    process.env.AGENT_USDT_MAX_PER_TX?.trim();
  if (!raw?.length) return undefined;
  try {
    return parseEther(raw);
  } catch {
    return undefined;
  }
}

/** Herramientas on-chain/simuladas según rol A2A dual. */
export function createA2aDualTools(role: "alicia" | "juan"): ToolSet {
  if (role === "juan") {
    return {
      checkTBnbBalance: tool({
        description:
          "Lee saldo nativo **tBNB** en opBNB testnet (Wei + balanceHuman). Omití address para ver la tesorería agente si existe.",
        inputSchema: z.object({}),

        execute: async () => {
          const agent = getAgentAccount();
          if (!agent?.address)
            throw new Error(
              "Sin AGENT_WALLET_PRIVATE_KEY válida para ver balance de tesorería.",
            );
          const pc = getPublicClient(OPBNB_TESTNET_CHAIN_ID);
          const wei = await pc.getBalance({ address: agent.address });
          const addr = getAddress(agent.address);
          return {
            address: addr,
            symbol: "tBNB" as const,
            decimals: NATIVE_DECIMALS,
            balanceWei: wei.toString(),
            balanceHuman: formatEther(wei),
            chainId: OPBNB_TESTNET_CHAIN_ID,
            explorerUrl: exploreAddressUrl(addr, OPBNB_TESTNET_CHAIN_ID),
            explorerBaseUrl: A2A_TESTNET_EXPLORER_BASE,
            howToVerifyOnScan:
              `${A2A_TESTNET_EXPLORER_BASE}/address/${addr}`,
          };
        },
      }),

      submitDeliverableAndInvoice: tool({
        description:
          "Simula entrega de trabajo + factura contra la tesorería de Alicia (**single_wallet_demo**, sin segunda wallet). Solo JSON; Alicia confirmará después on-chain.",
        inputSchema: z.object({
          milestone: z
            .string()
            .describe("Nombre del hito entregado (ej. Landing hero + CTA)."),
          amountHuman: z
            .union([z.string(), z.number()])
            .describe(
              "Monto solicitado en tBNB decimal humano, micro-monto de demo (< límite A2A_MAX_DEMO_TBNB).",
            ),
          summary: z
            .string()
            .describe("Resumen ejecutivo de lo entregado y criterios de aceptación."),
        }),

        execute: async ({
          milestone,
          amountHuman,
          summary,
        }: {
          milestone: string;
          amountHuman: string | number;
          summary: string;
        }) => {
          const agent = getAgentAccount();
          if (!agent?.address) {
            throw new Error(
              "Falta AGENT_WALLET_PRIVATE_KEY para referencia de tesorería Alicia en la demo.",
            );
          }
          const amtStr =
            typeof amountHuman === "number"
              ? amountHuman.toString()
              : String(amountHuman).trim();
          let value: bigint;
          try {
            value = parseEther(amtStr);
          } catch {
            throw new Error("amountHuman no es válido como tBNB decimal.");
          }
          if (value <= BigInt(0))
            throw new Error("amountHuman debe ser mayor que cero.");

          const maxDemo = parseA2aMaxDemoTbnbHuman();
          if (maxDemo > BigInt(0) && value > maxDemo) {
            throw new Error(
              `Factura rechazada: amountHuman ${amtStr} tBNB supera A2A_MAX_DEMO_TBNB (micro-montos de prueba).`,
            );
          }

          const treasuryAddress = getAddress(agent.address);
          return {
            settlement: "single_wallet_demo" as const,
            milestone,
            amountHuman: amtStr,
            currency: "tBNB" as const,
            summary,
            payeeTreasuryHint: treasuryAddress,
            explorerBaseUrl: A2A_TESTNET_EXPLORER_BASE,
            howToVerifyOnScan: `${A2A_TESTNET_EXPLORER_BASE} — usar tx hash cuando Alicia ejecute settle.`,
            chainId: OPBNB_TESTNET_CHAIN_ID,
            noteOnChain:
              "El pago on-chain será autotransferencia desde tesorería Alicia para generar vista en explorer.",
          };
        },
      }),
    };
  }

  return {
    checkTBnbBalance: tool({
      description:
        "Lee saldo tBNB de la tesorería (wallet agente) u otra dirección 0x en opBNB testnet.",
      inputSchema: z.object({
        address: z.string().optional().describe("0x válida; omitir para cuenta agente."),
      }),

      execute: async ({ address }: { address?: string }) => {
        const pc = getPublicClient(OPBNB_TESTNET_CHAIN_ID);

        let owner: `0x${string}`;
        if (address?.trim().length) {
          if (!isAddress(address.trim())) {
            throw new Error(
              "Dirección `address` no es válida (formato 0x 20 bytes).",
            );
          }
          owner = getAddress(address.trim());
        } else {
          const agent = getAgentAccount();
          if (!agent) throw new Error("Sin wallet agente ni address.");
          owner = agent.address;
        }

        const wei = await pc.getBalance({ address: owner });
        return {
          address: owner,
          symbol: "tBNB" as const,
          decimals: NATIVE_DECIMALS,
          balanceWei: wei.toString(),
          balanceHuman: formatEther(wei),
          chainId: OPBNB_TESTNET_CHAIN_ID,
          explorerUrl: exploreAddressUrl(owner, OPBNB_TESTNET_CHAIN_ID),
          explorerBaseUrl: A2A_TESTNET_EXPLORER_BASE,
          howToVerifyOnScan:
            `${A2A_TESTNET_EXPLORER_BASE}/address/${owner} para ver balances y txs.`,
        };
      },
    }),

    publishFreelanceJob: tool({
      description:
        "Simula publicación de oferta freelance (dev web); micro-presupuesto testnet solo JSON.",
      inputSchema: z.object({
        title: z.string().describe("Título corto del encargo."),
        scope: z.string().describe("Qué debe entregar el freelancer."),
        budgetMaxHuman: z
          .string()
          .describe(
            "Tope máximo en tBNB humano muy bajo (ej. \"0.0002\") acorde demo.",
          ),
      }),

      execute: async ({
        title,
        scope,
        budgetMaxHuman,
      }: {
        title: string;
        scope: string;
        budgetMaxHuman: string;
      }) => {
        const agent = getAgentAccount();
        if (!agent?.address)
          throw new Error("Sin AGENT_WALLET_PRIVATE_KEY para treasuryAddress.");
        const treasuryAddress = getAddress(agent.address);

        let budgetWei: bigint;
        try {
          budgetWei = parseEther(budgetMaxHuman.trim());
        } catch {
          throw new Error("budgetMaxHuman no es decimal tBNB válido.");
        }
        const maxDemo = parseA2aMaxDemoTbnbHuman();
        if (maxDemo > BigInt(0) && budgetWei > maxDemo)
          throw new Error(
            `budgetMaxHuman supera límite demo A2A_MAX_DEMO_TBNB.`,
          );

        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `job-${Date.now()}`;

        return {
          jobId: id,
          title,
          scope,
          budgetMaxHuman: budgetMaxHuman.trim(),
          treasuryAddress,
          chainId: OPBNB_TESTNET_CHAIN_ID,
          explorerBaseUrl: A2A_TESTNET_EXPLORER_BASE,
          howToVerifyOnScan:
            `${A2A_TESTNET_EXPLORER_BASE} — txs de pago aparecerán bajo esa tesorería.`,
        };
      },
    }),

    proposePaymentSettlement: tool({
      description:
        "Registra liquidación pendiente esperando OK explícito del usuario humano antes de sendSettlementTBnb.",
      inputSchema: z.object({
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(
            "Monto en tBNB humano a liquidar tras confirmación (micro-monto).",
          ),
        validationSummary: z
          .string()
          .describe("Por qué el entregable y monto cumplen la oferta."),
      }),

      execute: async ({
        amountHuman,
        validationSummary,
      }: {
        amountHuman: string | number;
        validationSummary: string;
      }) => {
        const agent = getAgentAccount();
        if (!agent?.address)
          throw new Error("Sin wallet agente para referencia tesorería.");
        const to = getAddress(agent.address);

        const amtStr =
          typeof amountHuman === "number"
            ? amountHuman.toString()
            : String(amountHuman).trim();
        let value: bigint;
        try {
          value = parseEther(amtStr);
        } catch {
          throw new Error("amountHuman no válido.");
        }
        if (value <= BigInt(0)) throw new Error("Monto > 0 requerido.");
        const maxDemo = parseA2aMaxDemoTbnbHuman();
        if (maxDemo > BigInt(0) && value > maxDemo)
          throw new Error(
            "Monto supera A2A_MAX_DEMO_TBNB; pedí factura menor a Juan.",
          );

        return {
          status: "awaiting_user_confirmation" as const,
          amountHuman: amtStr,
          to,
          flow: "A2A" as const,
          validationSummary,
          explorerBaseUrl: A2A_TESTNET_EXPLORER_BASE,
          nextStepHuman:
            "El usuario debe confirmar en modal; después ejecutás sendSettlementTBnb con ese monto.",
        };
      },
    }),

    sendSettlementTBnb: tool({
      description:
        "Liquida micro-monto tBNB vía **autotransferencia** desde tesorería (misma cuenta `to`). Solo tras confirmación del usuario.",
      inputSchema: z.object({
        amountHuman: z.union([z.string(), z.number()]),
      }),

      execute: async ({
        amountHuman,
      }: {
        amountHuman: string | number;
      }) => {
        const walletClient = getAgentWalletClientOpbnbTestnet();
        if (!walletClient?.account) {
          const formatHint = getAgentPrivateKeyFormatHint();
          if (formatHint) throw new Error(formatHint);
          throw new Error(
            "Falta AGENT_WALLET_PRIVATE_KEY válida para firmar.",
          );
        }

        const from = walletClient.account.address;
        const to = getAddress(from);

        const amountStr =
          typeof amountHuman === "number"
            ? amountHuman.toString()
            : String(amountHuman).trim();

        let value: bigint;
        try {
          value = parseEther(amountStr);
        } catch {
          throw new Error("amountHuman inválido.");
        }
        if (value <= BigInt(0)) throw new Error("Monto debe ser > 0.");

        const maxWei = parseMaxTbnbPerTxEnv();
        if (maxWei !== undefined && value > maxWei)
          throw new Error("Monto mayor que AGENT_TBNB_MAX_PER_TX.");

        const maxDemo = parseA2aMaxDemoTbnbHuman();
        if (maxDemo > BigInt(0) && value > maxDemo)
          throw new Error("Supera A2A_MAX_DEMO_TBNB.");

        const txHash = await walletClient.sendTransaction({
          to,
          value,
          chain: opBNBTestnet,
          account: walletClient.account,
        });

        return {
          flow: "A2A" as const,
          settlement: "self_transfer_demo" as const,
          txHash,
          explorerUrl: exploreTxUrl(txHash, opBNBTestnet.id),
          from,
          to,
          amountHuman: amountStr,
          valueWei: value.toString(),
          symbol: "tBNB" as const,
        };
      },
    }),
  };
}
