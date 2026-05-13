import type { Metadata } from "next";
import Link from "next/link";

import { PaymentWorkflowCanvas } from "@/app/workflows/_components/payment-workflow-canvas";

export const metadata: Metadata = {
  title: "Workflow A2C · Agent to Consumer",
  description:
    "Un agente reparte un ingreso en tBNB de prueba entre salud, familia y servicios, según lo que pida la persona usuaria.",
};

export default function WorkflowA2CPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 pb-8">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">A2C · Agent to Consumer</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[#aab3c5]">
          Coincide con el demo de{" "}
          <Link href="/agentes/a2c" className="text-[#f0b90b]/90 underline-offset-2 hover:underline">
            reparto personal
          </Link>
          : la persona cuenta qué dinero entró y para qué lo quiere usar; el agente propone envíos separados —por
          ejemplo salud, hijos o servicios— siempre en la moneda de prueba tBNB.
        </p>
      </header>

      <PaymentWorkflowCanvas scenario="a2c" />
    </div>
  );
}
