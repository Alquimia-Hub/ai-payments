import type { Metadata } from "next";

import { AgentPaymentsChat } from "@/app/agentes/_components/agent-payments-chat";

export const metadata: Metadata = {
  title: "A2B · Agent to Business",
  description: "Pagos desde un agente a empresas o proveedores.",
};

const EXAMPLE_PAYEE_ARG =
  "0xb16b005000000000000000000000000000000043";

export default function AgentA2BPage() {
  return (
    <AgentPaymentsChat
      api="/api/agents/execute"
      scenario="a2b"
      title="A2B · Agent to Business"
      emptyState={{ title: "Agent → Business" }}
      textareaPlaceholder="Ej.: el agente del marketplace debe pagar al proveedor en tBNB…"
      suggestions={[
        {
          label: "Mercado Libre / stock",
          prompt: `Soy agente IA de cuenta marketplace: falta inventario SKU «mate premium». Verificá balance de tesorería ${EXAMPLE_PAYEE_ARG} con checkTBnbBalance y pagá 0.0742 tBNB al proveedor arg ${EXAMPLE_PAYEE_ARG}; flow A2B. Explica autonomía y compliance si lo piden.`,
        },
        {
          label: "Procurement recurrente",
          prompt: `Soy procurement: ejecutamos 0.0249 tBNB mensuales a ${EXAMPLE_PAYEE_ARG}; flow A2B.`,
        },
        {
          label: "Reposición proveedor",
          prompt: `Comercio necesita abonar reposición: ejecutá 0.091 tBNB a proveedor ${EXAMPLE_PAYEE_ARG} con menor fricción de intermediarios locales; narrá cómo automatiza el agente; flow A2B.`,
        },
      ]}
    />
  );
}
