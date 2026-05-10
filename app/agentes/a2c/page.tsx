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
      api="/api/agents/demo"
      scenario="a2c"
      title="A2C · Agent to Consumer"
      lead={
        <>
          Movés valor desde ingresos o remesas hacia vos, familia o cuentas fijas como
          salud o servicios —siempre dentro del modo <strong>A2C</strong> aquí.
        </>
      }
      emptyState={{
        title: "Agent → Consumidor",
        description:
          "Freelancers, familias con remesa o profesionales: chips o nuevo prompt.",
      }}
      textareaPlaceholder="Ej.: partí este ingreso en varios gastos sobre direcciones 0x…"
      suggestions={[
        {
          label: "Freelancer Upwork/Fiverr",
          prompt: `Llegaron 1800 USDT consolidados: primero consultá tesorería personal ${EX_PRIMARY} con checkUSDTBalance; enviar 220 USDT a cuenta salud ${EX_SECONDARY}, 95 USDT a cuenta software (${EX_PRIMARY}) como otro ejemplo, y sintetiza el disponible proyectado después; flow A2C.`,
        },
        {
          label: "Remesa familia",
          prompt: `Entraron 650 USDT de EE.UU.: asignamos 160 a cuenta hijos ${EX_SECONDARY} y 210 a servicios (${EX_PRIMARY}) con sendUSDT separados cuando sume granularidad; flow A2C.`,
        },
        {
          label: "Profesional recurrente",
          prompt: `Cobré 330 USDT de consultas: pagá equipo médico ${EX_SECONDARY} 144 USDT con autonomía del agente; flow A2C.`,
        },
      ]}
    />
  );
}
