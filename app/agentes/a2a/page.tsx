import type { Metadata } from "next";

import { AgentPaymentsChat } from "@/app/agentes/_components/agent-payments-chat";

export const metadata: Metadata = {
  title: "A2A · Agent to Agent",
  description: "Pagos Agent-to-Agent entre agentes autónomos.",
};

/** Dirección 0x de ejemplo para chips y demos. */
const EXAMPLE_PAYEE = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export default function AgentA2APage() {
  return (
    <AgentPaymentsChat
      api="/api/agents/demo"
      scenario="a2a"
      title="A2A · Agent to Agent"
      lead={
        <>
          Pagos donde un agente liquida a otro en segundos, sin revisión manual.
          Probá ejemplos o describí contra quién y cuánto, con dirección hex y flujo{" "}
          <strong>A2A</strong> (<code>{EXAMPLE_PAYEE.slice(0, 10)}…</code>
          ).
        </>
      }
      emptyState={{
        title: "Listo para A2A",
        description:
          "Usá ejemplos con chips o planteá un nuevo pago entre agentes.",
      }}
      textareaPlaceholder="Describí destinatario, monto USDT y contexto para liquidar como A2A…"
      suggestions={[
        {
          label: "Diseño → Dev (landing)",
          prompt: `Somos dos agentes. Diseño cerró el banner y liquida 120 USDT a desarrollo por la landing. Destinatario ${EXAMPLE_PAYEE}. Si hace falta, consultá disponibilidad con checkUSDTBalance del pagador y ejecutá sendUSDT con flow A2A.`,
        },
        {
          label: "Logística → Transporte",
          prompt: `Despacho urgente CABA al interior: como logística transfiero 58.5 USDT al agente transporte (${EXAMPLE_PAYEE}) sin intervención humana intermedia. Orquestá chequeo rápido y sendUSDT A2A.`,
        },
        {
          label: "Consultar balance",
          prompt: `¿Qué disponibilidad muestra esta tesorería? Dirección ${EXAMPLE_PAYEE}`,
        },
      ]}
    />
  );
}
