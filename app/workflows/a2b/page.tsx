import type { Metadata } from "next";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2B · Agent to Business",
  description:
    "Diagrama Agent-to-Business: tienda, orden contra proveedor y liquidación estable.",
};

export default function WorkflowA2BPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2B · Agent to Business</h1>
      </header>

      <PaymentWorkflowCanvas scenario="a2b" />
    </div>
  );
}
