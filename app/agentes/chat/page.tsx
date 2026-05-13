"use client";

import { AgentPaymentsChat } from "@/app/agentes/_components/agent-payments-chat";

export default function AgentesChatPage() {
  return (
    <AgentPaymentsChat
      api="/api/agents/execute"
      title="Chat agente · tBNB testnet"
      emptyState={{ title: "Sin mensajes" }}
    />
  );
}
