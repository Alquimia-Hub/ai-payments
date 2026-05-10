import type { Metadata } from "next";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2A · Agent to Agent",
  description:
    "Diagrama Agent-to-Agent: diseño cerrando trabajo y desarrollo acreditándose en USDT.",
};

export default function WorkflowA2APage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2A · Agent to Agent</h1>
        <div className="text-sm leading-relaxed text-[#aab3c5]">
          Dos agentes alineados: entrega técnica, liquidación y acreditación. El panel lleva el
          chat del mismo flujo cuando quieras profundizar.
        </div>
      </header>

      <PaymentWorkflowCanvas scenario="a2a" />
    </div>
  );
}
