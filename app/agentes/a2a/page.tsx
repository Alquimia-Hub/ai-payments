import type { Metadata } from "next";

export const metadata: Metadata = { title: "A2A · Agent to Agent" };

export default function AgentA2APage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">A2A · Agent to Agent</h1>
      <p className="text-[#aab3c5] leading-relaxed">
        Espacio demo para pagos donde un agente orquesta transacciones hacia otro agente sobre opBNB.
        Conectará próximos flujos A2A (cuando definas payloads y contratos de demostración).
      </p>
    </div>
  );
}
