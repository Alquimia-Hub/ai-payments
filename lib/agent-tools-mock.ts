import { randomBytes } from "crypto";

import { tool } from "ai";
import {
  keccak256,
  formatEther,
  parseEther,
  parseUnits,
  stringToHex,
  type Hex,
  getAddress,
  isAddress,
} from "viem";
import { z } from "zod";

import { exploreAddressUrl, exploreTxUrl, opBNBTestnet, OPBNB_TESTNET_CHAIN_ID } from "@/lib/opbnb";

/** Wallet ficticia cuando no hay `address` (demo sin clave servidor). */
const MOCK_AGENT_PAYER = getAddress(
  "0xdEadf00d00000000000000000000000000001001",
);

const MOCK_DECIMALS = 18;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function deterministicTbnbWeiBalance(owner: Hex): bigint {
  const h = BigInt(
    keccak256(stringToHex(`mock_tbnb_bal:${owner.toLowerCase()}`)),
  );
  const min = parseEther("12");
  const span = BigInt(parseUnits("85", MOCK_DECIMALS));
  return min + (h % (span === BigInt(0) ? BigInt(1) : span));
}

function fakeTxHash(): Hex {
  return keccak256(`0x${randomBytes(32).toString("hex")}`);
}

/** Mock alineado a las herramientas reales (`checkTBnbBalance`, `sendTBnb`). */
export function createMockAgentTools(lockedFlow: "A2A" | "A2B" | "A2C") {
  return {
    checkTBnbBalance: tool({
      description:
        "Consulta saldo **tBNB** simulado para la cuenta 0x (balanceWei deterministico demo).",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe(
            "Tesorería 0x. Si omitís, se usa la cartera ficticia del agente en esta página demo.",
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

        const wei = deterministicTbnbWeiBalance(owner);

        return {
          address: owner,
          symbol: "tBNB" as const,
          decimals: MOCK_DECIMALS,
          balanceWei: wei.toString(),
          balanceHuman: formatEther(wei),
          chainId: OPBNB_TESTNET_CHAIN_ID,
          explorerUrl: exploreAddressUrl(owner, OPBNB_TESTNET_CHAIN_ID),
          simulatedDemo: true as const,
        };
      },
    }),

    sendTBnb: tool({
      description:
        "Simula envío de **tBNB** registrando hash explorer ficticio para la demo (sin cadena real).",
      inputSchema: z.object({
        to: z.string().describe("Destinatario dirección 0x."),
        amountHuman: z
          .union([z.string(), z.number()])
          .describe(
            `Cantidad tBNB en decimal humano; el flow debe ser SIEMPRE ${lockedFlow}.`,
          ),
        flow: z
          .enum(["A2A", "A2B", "A2C"])
          .describe(
            `Debe ser ${lockedFlow} en esta página aunque el contexto sugiera otro modo.`,
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
          const parsed = parseEther(amountStr);
          if (parsed <= BigInt(0)) {
            throw new Error();
          }
        } catch {
          throw new Error(
            "amountHuman debe ser positivo como decimal tBNB válido.",
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
          simulatedDemo: true as const,
          symbol: "tBNB" as const,
        };
      },
    }),
  };
}
