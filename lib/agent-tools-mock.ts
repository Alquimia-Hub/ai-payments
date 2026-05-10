import { randomBytes } from "crypto";

import { tool } from "ai";
import {
  keccak256,
  parseUnits,
  stringToHex,
  type Hex,
  getAddress,
  isAddress,
} from "viem";
import { z } from "zod";

import { exploreTxUrl, opBNBTestnet, OPBNB_TESTNET_CHAIN_ID } from "@/lib/opbnb";

/** Wallet ficticia cuando no hay `address` (demo sin clave servidor). */
const MOCK_AGENT_PAYER = getAddress(
  "0xdEadf00d00000000000000000000000000001001",
);

const MOCK_DECIMALS = 18;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function deterministicBalanceRaw(owner: Hex): bigint {
  const h = BigInt(keccak256(stringToHex(`mock_usdt_bal:${owner.toLowerCase()}`)));
  const min = BigInt(parseUnits("50", MOCK_DECIMALS));
  const span = BigInt(parseUnits("400000", MOCK_DECIMALS));
  return min + (h % (span === BigInt(0) ? BigInt(1) : span));
}

function fakeTxHash(): Hex {
  return keccak256(`0x${randomBytes(32).toString("hex")}`);
}

/** Herramientas mock con mismo contrato tipado que las reales (`sendUSDT`, `checkUSDTBalance`). */
export function createMockAgentTools(lockedFlow: "A2A" | "A2B" | "A2C") {
  return {
    checkUSDTBalance: tool({
      description:
        "Consulta disponibilidad USDT reportada por el programa para la dirección 0x indicada (salida técnica con balance en wei/unidades brutas del token).",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe(
            "Tesorería 0x. Si omitís, se usa la cartera pagadora por defecto del agente en esta página.",
          ),
      }),
      execute: async ({ address }) => {
        let owner: Hex;
        if (address?.trim().length) {
          if (!isAddress(address.trim())) {
            throw new Error("Dirección `address` no es válida (0x… 20 bytes).");
          }
          owner = getAddress(address.trim()) as Hex;
        } else {
          owner = MOCK_AGENT_PAYER;
        }

        const rawBalance = deterministicBalanceRaw(owner);

        return {
          address: owner,
          decimals: MOCK_DECIMALS,
          balanceRaw: rawBalance.toString(),
          chainId: OPBNB_TESTNET_CHAIN_ID,
          tokenAddress: getAddress(
            "0xb16b005000000000000000000000000000000042",
          ) as Hex,
        };
      },
    }),

    sendUSDT: tool({
      description:
        "Envío programado de USDT hacia dirección contraparte usando el modo de página activo; registra explorer y métricas de la operación en el objeto de resultado.",
      inputSchema: z.object({
        to: z.string().describe("Destinatario dirección 0x."),
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(`Cantidad en unidades humanas; el modo de flujo debe ser SIEMPRE ${lockedFlow}.`),
        flow: z
          .enum(["A2A", "A2B", "A2C"])
          .describe(
            `Debe ser ${lockedFlow} en esta página; utiliza ese valor incluso cuando el ejemplo macro sea diferente.`,
          ),
      }),
      execute: async ({ to, amountHuman, flow }) => {
        if (flow !== lockedFlow) {
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
        try {
          const value = parseUnits(amountStr, MOCK_DECIMALS);
          if (value <= BigInt(0)) {
            throw new Error();
          }
        } catch {
          throw new Error(
            "amountHuman debe ser positivo en formato decimal válido.",
          );
        }

        await sleep(200 + Math.floor(Math.random() * 701));

        const txHash = fakeTxHash();

        return {
          flow,
          txHash,
          explorerUrl: exploreTxUrl(txHash, opBNBTestnet.id),
          from: MOCK_AGENT_PAYER,
          to: getAddress(trimmedTo),
          amountHuman,
          decimals: MOCK_DECIMALS,
        };
      },
    }),
  };
}
