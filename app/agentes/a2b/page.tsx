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
      api="/api/agents/demo"
      scenario="a2b"
      title="A2B · Agent to Business"
      lead={
        <>
          Liquida ante comerciantes, SaaS o proveedores: el agente puede abonar con
          USDT manteniendo el flujo <strong>A2B</strong> de esta página.
        </>
      }
      emptyState={{
        title: "Agent → Business",
        description:
          "Stock bajo, suscripciones o compras estable con chips o tu propio escenario.",
      }}
      textareaPlaceholder="Ej.: el agente del marketplace debe pagar al proveedor en USDT…"
      suggestions={[
        {
          label: "Mercado Libre / stock",
          prompt: `Soy agente IA de cuenta marketplace: falta inventario SKU «mate premium». Verificá balance de tesorería ${EXAMPLE_PAYEE_ARG} con checkUSDTBalance y pagá 742 USDT al proveedor arg ${EXAMPLE_PAYEE_ARG}; flow A2B. Explica autonomía y compliance si lo piden.`,
        },
        {
          label: "Suscripción SaaS recurrente",
          prompt: `Soy procurement: ejecutamos 249 USDT mensuales a ${EXAMPLE_PAYEE_ARG}; flow A2B.`,
        },
        {
          label: "Stablecoin sin colas intermedias",
          prompt: `Comercio necesita estable para stock: ejecutá 910 USDT a proveedor ${EXAMPLE_PAYEE_ARG} con menor fricción de intermediarios locales; narrá cómo automatiza el agente; flow A2B.`,
        },
      ]}
    />
  );
}
