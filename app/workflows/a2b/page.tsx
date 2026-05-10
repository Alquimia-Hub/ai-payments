import type { Metadata } from "next";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2B · Agent to Business",
  description:
    "Diagrama Agent-to-Business: tienda, orden contra proveedor y liquidación estable.",
};

export default function WorkflowA2BPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2B · Agent to Business</h1>
        <div className="text-sm leading-relaxed text-[#aab3c5]">
          El agente conecta señales de inventario/compra contra el lado proveedor sin friccionar con
          banca tradicional donde la política permite USDT-on-rails. Abrí el mismo caso en chat desde
          el panel.
        </div>
      </header>

      <PaymentWorkflowCanvas scenario="a2b" />
    </div>
  );
}
