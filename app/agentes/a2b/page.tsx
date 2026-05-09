import type { Metadata } from "next";

export const metadata: Metadata = { title: "A2B · Agent to Business" };

export default function AgentA2BPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">A2B · Agent to Business</h1>
      <p className="text-[#aab3c5] leading-relaxed">
        Caso demo para que un agente liquide frente a comerciantes/opciones SaaS usando USDT/opBNB;
        pendiente enlazar tus pasarelas reales cuando estén disponibles.
      </p>
    </div>
  );
}
