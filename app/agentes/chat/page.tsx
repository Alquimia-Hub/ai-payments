"use client";

import { AgentPaymentsChat } from "@/app/agentes/_components/agent-payments-chat";

export default function AgentesChatPage() {
  return (
    <AgentPaymentsChat
      api="/api/agents/execute"
      title="Chat agente · USDT testnet"
      lead={
        <>
          Ejecuta transferencias ERC-20 <strong>reales</strong> desde la wallet
          servidor (requiere{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-[#f0b90b]">
            OPENAI_API_KEY
          </code>
          {" + "}
          <code className="rounded bg-secondary px-1 py-0.5 text-[#f0b90b]">
            AGENT_WALLET_PRIVATE_KEY
          </code>
          ). Gas en tBNB.
        </>
      }
      emptyState={{
        title: "Sin mensajes",
        description:
          "Pide tu balance USDT testnet o un envío indicando dirección destino y monto humano (+ flujo A2A/A2B/A2C).",
      }}
      textareaPlaceholder="Ej: consulta mi balance USDT…"
    />
  );
}
