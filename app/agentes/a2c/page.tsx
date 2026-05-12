import type { Metadata } from "next";

import { AgentPaymentsChat } from "@/app/agentes/_components/agent-payments-chat";

export const metadata: Metadata = {
  title: "A2C · Agent to Consumer",
  description:
    "El agente distribuye o ejecuta pagos para usuarios particulares o familias.",
};

/** Direcciones 0x de ejemplo para chips y demos. */
const EX_PRIMARY = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const EX_SECONDARY = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

export default function AgentA2CPage() {
  return (
    <AgentPaymentsChat
      api="/api/agents/execute"
      scenario="a2c"
      title="A2C · Agent to Consumer"
      emptyState={{ title: "Agent → Consumidor" }}
      textareaPlaceholder="Ej.: partí este ingreso en varios gastos sobre direcciones 0x…"
      suggestions={[
        {
          label: "Freelancer Upwork/Fiverr",
          prompt: `Llegaron 0.018 tBNB consolidados: primero consultá tesorería personal ${EX_PRIMARY} con checkTBnbBalance; enviar 0.0022 tBNB a cuenta salud ${EX_SECONDARY}, 0.00095 tBNB a cuenta software (${EX_PRIMARY}) como otro ejemplo, y sintetiza el disponible proyectado después; flow A2C.`,
        },
        {
          label: "Remesa familia",
          prompt: `Entraron 0.0065 tBNB de remesa: asignamos 0.0016 a cuenta hijos ${EX_SECONDARY} y 0.0021 a servicios (${EX_PRIMARY}) con sendTBnb separados cuando sume granularidad; flow A2C.`,
        },
        {
          label: "Cobro consultoría",
          prompt: `Cobré 0.0033 tBNB de consultas: pagá equipo médico ${EX_SECONDARY} 0.00144 tBNB con autonomía del agente; flow A2C.`,
        },
      ]}
    />
  );
}
