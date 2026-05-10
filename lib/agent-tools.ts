import { tool } from "ai";
import { getAddress, isAddress, parseUnits } from "viem";
import { z } from "zod";

import { erc20Abi } from "@/lib/abis/erc20";
import {
  exploreTxUrl,
  getAgentAccount,
  getAgentWalletClientOpbnbTestnet,
  getPublicClient,
  getUsdtAddressOpbnbTestnet,
  opBNBTestnet,
  OPBNB_TESTNET_CHAIN_ID,
} from "@/lib/opbnb";

async function readUsdtDecimals(): Promise<number> {
  const publicClient = getPublicClient(OPBNB_TESTNET_CHAIN_ID);
  const token = getUsdtAddressOpbnbTestnet();
  try {
    const d = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    });
    return Number(d);
  } catch {
    return 18;
  }
}

function parseMaxHumanFromEnv(decimals: number): bigint | undefined {
  const raw = process.env.AGENT_USDT_MAX_PER_TX?.trim();
  if (!raw?.length) return undefined;
  try {
    return parseUnits(raw, decimals);
  } catch {
    return undefined;
  }
}

export const agentTools = {
  checkUSDTBalance: tool({
    description:
      "Lee el balance de USDT en opBNB testnet (contrato configurado por NEXT_PUBLIC_USDT_ADDRESS_OPBNB_TESTNET).",
    inputSchema: z.object({
      address: z
        .string()
        .optional()
        .describe(
          "Dirección 0x a consultar. Si se omite, usa la cuenta del agente cuando exista AGENT_WALLET_PRIVATE_KEY.",
        ),
    }),
    execute: async ({ address }) => {
      const publicClient = getPublicClient(OPBNB_TESTNET_CHAIN_ID);
      const token = getUsdtAddressOpbnbTestnet();

      let owner: `0x${string}`;
      if (address?.trim().length) {
        if (!isAddress(address.trim())) {
          throw new Error("Dirección `address` no es válida (no es formato 0x de 20 bytes).");
        }
        owner = getAddress(address.trim());
      } else {
        const agent = getAgentAccount();
        if (!agent) {
          throw new Error(
            "Sin dirección ni wallet agente: pasa `address` o define AGENT_WALLET_PRIVATE_KEY en el servidor.",
          );
        }
        owner = agent.address;
      }

      const [rawBalance, decimals] = await Promise.all([
        publicClient.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [owner],
        }),
        readUsdtDecimals(),
      ]);

      return {
        address: owner,
        decimals,
        balanceRaw: rawBalance.toString(),
        chainId: OPBNB_TESTNET_CHAIN_ID,
        tokenAddress: token,
      };
    },
  }),

  sendUSDT: tool({
    description:
      "Transfiere USDT en opBNB testnet desde la wallet servidor (AGENT_WALLET_PRIVATE_KEY) con ERC-20 transfer. Variante A2A/A2B/A2C es solo clasificación/log; gas en tBNB.",
    inputSchema: z.object({
      to: z
        .string()
        .describe("Destinatario(opBNB testnet): dirección 0x válida."),
      amountHuman: z
        .union([z.string(), z.number()])
        .describe("Cantidad en unidades humanas (no wei), usando los decimals del token."),
      flow: z
        .enum(["A2A", "A2B", "A2C"])
        .describe(
          "Clasificación solicitada por el usuario; no cambia la llamada en cadena.",
        ),
    }),
    execute: async ({ to, amountHuman, flow }) => {
      const walletClient = getAgentWalletClientOpbnbTestnet();
      if (!walletClient?.account) {
        throw new Error(
          "Falta AGENT_WALLET_PRIVATE_KEY en el servidor: no se pueden firmar transferencias.",
        );
      }

      const trimmedTo = typeof to === "string" ? to.trim() : "";
      if (!trimmedTo || !isAddress(trimmedTo)) {
        throw new Error("Campo `to` debe ser una dirección 0x válida.");
      }

      const decimals = await readUsdtDecimals();
      const maxHuman = parseMaxHumanFromEnv(decimals);

      const amountStr =
        typeof amountHuman === "number"
          ? amountHuman.toString()
          : String(amountHuman).trim();

      let value: bigint;
      try {
        value = parseUnits(amountStr, decimals);
      } catch {
        throw new Error(
          "amountHuman no es válido como cantidad decimal en unidades token (digits/decimals según ERC-20).",
        );
      }
      if (value <= BigInt(0)) {
        throw new Error("amountHuman debe producir cantidad mayor que cero en unidades token.");
      }
      if (maxHuman !== undefined && value > maxHuman) {
        throw new Error(
          `Cantidad mayor que AGENT_USDT_MAX_PER_TX (${process.env.AGENT_USDT_MAX_PER_TX}).`,
        );
      }

      const token = getUsdtAddressOpbnbTestnet();

      const txHash = await walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: "transfer",
        args: [getAddress(trimmedTo), value],
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
        decimals,
      };
    },
  }),
};
