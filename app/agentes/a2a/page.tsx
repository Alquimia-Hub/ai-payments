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
      api="/api/agents/execute"
      scenario="a2a"
      title="A2A · Agent to Agent"
      emptyState={{ title: "Listo para A2A" }}
      textareaPlaceholder="Describí destinatario, monto tBNB y contexto para liquidar como A2A…"
      suggestions={[
        {
          label: "Diseño → Dev (landing)",
          prompt: `Somos dos agentes. Diseño cerró el banner y liquida 0.012 tBNB a desarrollo por la landing. Destinatario ${EXAMPLE_PAYEE}. Si hace falta, consultá disponibilidad con checkTBnbBalance del pagador y ejecutá sendTBnb con flow A2A.`,
        },
        {
          label: "Logística → Transporte",
          prompt: `Despacho urgente CABA al interior: como logística transfiero 0.00585 tBNB al agente transporte (${EXAMPLE_PAYEE}) sin intervención humana intermedia. Orquestá chequeo rápido y sendTBnb A2A.`,
        },
        {
          label: "Consultar balance",
          prompt: `¿Qué disponibilidad muestra esta tesorería? Dirección ${EXAMPLE_PAYEE}`,
        },
      ]}
    />
  );
}
