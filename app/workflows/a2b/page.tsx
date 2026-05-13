import type { Metadata } from "next";
import Link from "next/link";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2B · Agent to Business",
  description:
    "Un agente revisa la tesorería y paga a un proveedor en tBNB de prueba, con montos mínimos de demo.",
};

export default function WorkflowA2BPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2B · Agent to Business</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[#aab3c5]">
          Coincide con el demo de{" "}
          <Link href="/agentes/a2b" className="text-[#f0b90b]/90 underline-offset-2 hover:underline">
            negocio a proveedor
          </Link>
          : el agente ayuda a mirar si alcanza el saldo en la tesorería y, cuando corresponde, envía el pago en tBNB al
          proveedor en la red de prueba.
        </p>
      </header>

      <PaymentWorkflowCanvas scenario="a2b" />
    </div>
  );
}
