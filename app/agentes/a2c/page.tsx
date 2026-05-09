import type { Metadata } from "next";

export const metadata: Metadata = { title: "A2C · Agent to Consumer" };

export default function AgentA2CPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">A2C · Agent to Consumer</h1>
      <p className="text-[#aab3c5] leading-relaxed">
        Flujo ejemplo agente‑a‑consumidor para micro‑pagos, suscripciones o top‑ups dirigidos desde la
        app; sirve placeholder hasta que enlaces tu backend de intents.
      </p>
    </div>
  );
}
