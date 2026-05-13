import type { Metadata } from "next";

import { A2aDualChatShell } from "@/app/agentes/_components/a2a-dual-chat";

export const metadata: Metadata = {
  title: "A2A · Agent to Agent · Alicia y Juan",
  description:
    "Dos agentes (Alicia tesorería, Juan freelancer) coordinan cobro micro‑tBNB con relay y confirmación humana.",
};

export default function AgentA2APage() {
  return (
    <A2aDualChatShell
      lead={
        <p>
          <strong className="text-[#e8edf5]">Dos chats</strong>: escribís en{" "}
          <span className="text-[#f0b90b]/90">Juan</span> para iniciar la factura simulada;{" "}
          <span className="text-[#f0b90b]/90">Alicia</span> recibe por relay JSON, propone liquidación con{" "}
          <code className="rounded bg-white/10 px-1 text-[13px]">proposePaymentSettlement</code>,
          vos confirmás el pago en el modal y Alicia ejecuta{" "}
          <code className="rounded bg-white/10 px-1 text-[13px]">sendSettlementTBnb</code> como{" "}
          <strong className="text-[#e8edf5]">autotransferencia</strong> mínima (misma wallet = tesorería) para tener{" "}
          <strong className="text-[#e8edf5]">link opBNBScan</strong>.
        </p>
      }
      suggestions={[
        {
          label: "Cobrar landing · 0.0001 tBNB",
          prompt:
            "Necesito cobrar a Alicia la landing hero + formulario corto ya entregados. Ejecutá submitDeliverableAndInvoice con milestone “Landing inicial”, summary entregables y amountHuman \"0.0001\".",
        },
        {
          label: "Cobro mínimo 0.00005",
          prompt:
            "Presentá cobranza mínima de prueba submitDeliverableAndInvoice amountHuman \"0.00005\" por ajustes tipográficos y CTA banner.",
        },
        {
          label: "Consultar tesorería (Juan)",
          prompt:
            "Usá checkTBnbBalance (sin campos extra) para leer disponibilidad tBNB de la tesorería Alicia en testnet y explicamelo corto.",
        },
      ]}
    />
  );
}
