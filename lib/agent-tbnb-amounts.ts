import { formatEther, parseEther } from "viem";

/**
 * Piso de tBNB por envío / factura / liquidación en herramientas de agentes (A2A, A2B, A2C, chat).
 * Alineado con la demo A2A (micro-montos tipo `0.00005`).
 *
 * - `AGENT_TBNB_MIN_PER_TX`: decimal humano (ej. `0.0001`). `0` desactiva el chequeo.
 * - Si no está definido: **0.00005** tBNB.
 */
export function parseAgentTbnbMinPerTxWei(): bigint {
  const raw = process.env.AGENT_TBNB_MIN_PER_TX?.trim();
  if (raw === "0" || raw === "0.0" || raw === "0.00") {
    return BigInt(0);
  }
  try {
    if (raw?.length) {
      return parseEther(raw);
    }
  } catch {
    /* default */
  }
  try {
    return parseEther("0.00005");
  } catch {
    return BigInt(0);
  }
}

/** Rechaza montos estrictamente por debajo del mínimo configurado. */
export function assertAtLeastAgentTbnbMin(
  valueWei: bigint,
  fieldLabel: string,
): void {
  const minWei = parseAgentTbnbMinPerTxWei();
  if (minWei <= BigInt(0)) return;
  if (valueWei < minWei) {
    throw new Error(
      `${fieldLabel}: el monto mínimo es ${formatEther(minWei)} tBNB (variable AGENT_TBNB_MIN_PER_TX).`,
    );
  }
}
