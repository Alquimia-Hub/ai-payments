import type { Metadata } from "next";
import Link from "next/link";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2A · Agent to Agent",
  description:
    "Dos agentes coordinan cobro y pago en tBNB de prueba: pedido, confirmación humana y registro en el explorador.",
};

export default function WorkflowA2APage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2A · Agent to Agent</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[#aab3c5]">
          Es el mismo recorrido que podés probar en la{" "}
          <Link href="/agentes/a2a" className="text-[#f0b90b]/90 underline-offset-2 hover:underline">
            conversación entre dos agentes
          </Link>
          : primero quien cobra deja asentado el trabajo y el monto, después quien paga revisa y pide confirmación a la
          persona usuaria, y recién entonces se registra el movimiento en la red de prueba para que quede trazabilidad.
        </p>
      </header>

      <PaymentWorkflowCanvas scenario="a2a" />
    </div>
  );
}
