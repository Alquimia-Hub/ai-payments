import { parseEther } from "viem";

/** Base del explorador testnet incluido en respuestas simuladas. */
export const A2A_TESTNET_EXPLORER_BASE = "https://testnet.opbnbscan.com";

/** Límite humano máximo permitido por facturas simuladas (Juan → Alicia). Env opcional `A2A_MAX_DEMO_TBNB`. El piso mínimo por monto: `AGENT_TBNB_MIN_PER_TX` en `lib/agent-tbnb-amounts.ts`. */
export function parseA2aMaxDemoTbnbHuman(): bigint {
  const raw = process.env.A2A_MAX_DEMO_TBNB?.trim();
  try {
    if (raw?.length) return parseEther(raw);
  } catch {
    /* usar default */
  }
  try {
    return parseEther("0.0005");
  } catch {
    return BigInt(0);
  }
}
