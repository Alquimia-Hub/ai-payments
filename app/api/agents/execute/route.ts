import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  type UIMessage,
  streamText,
  stepCountIs,
} from "ai";

import { agentTools } from "@/lib/agent-tools";
import { OPBNB_TESTNET_CHAIN_ID } from "@/lib/opbnb";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGENT_SYSTEM = `Eres el agente de pagos demo en **opBNB testnet** exclusivamente.

Reglas operativas:
- Solo interactúas con USDT configurado como token ERC-20 del entorno testnet (dirección pública opcional NEXT_PUBLIC_USDT_ADDRESS_OPBNB_TESTNET).
- Las transferencias firma la wallet servidor sólo cuando exista AGENT_WALLET_PRIVATE_KEY; gas en **tBNB**. Si no hay fondos suficientes, explica cómo obtener faucet testnet con claridad sin inventar tasas cambiarias fuera del contexto.
- Antes de transferir grandes cantidades puede usar **checkUSDTBalance** cuando el usuario pregunte disponibilidad o convenga sanity-check.
- **sendUSDT** requiere destinatario 0x y monto humano válido + flow uno de A2A | A2B | A2C (clasificación sólo auditoría/logs del usuario).
- Nunca ejecutes llamadas contra mainnet; chain id debe ser ${OPBNB_TESTNET_CHAIN_ID}.

Seguridad: testnet/demo; recomienda wallets dedicadas y valores bajos.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const pk = process.env.AGENT_WALLET_PRIVATE_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY ausente — configura el secreto servidor (.env.local / CI) para el agente.",
      },
      { status: 503 },
    );
  }
  if (!pk) {
    return Response.json(
      {
        error:
          "AGENT_WALLET_PRIVATE_KEY ausente — requerida para transferencias servidor en opBNB testnet (nunca público NEXT_PUBLIC_*).",
      },
      { status: 503 },
    );
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("messages" in parsed) ||
    !Array.isArray((parsed as { messages: unknown }).messages)
  ) {
    return Response.json(
      { error: "Se espera cuerpo { messages: UIMessage[] }." },
      { status: 412 },
    );
  }

  const messages = (parsed as { messages: UIMessage[] }).messages;
  if (messages.length === 0) {
    return Response.json(
      { error: "messages no puede estar vacío." },
      { status: 412 },
    );
  }

  try {
    const provider = createOpenAI({ apiKey });
    const result = streamText({
      model: provider.chat("gpt-4o-mini"),
      system: AGENT_SYSTEM,
      messages: await convertToModelMessages(messages),
      tools: agentTools,
      stopWhen: stepCountIs(10),
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[api/agents/execute]", err);
    return Response.json(
      { error: "Error interno del agente (streamText)." },
      { status: 500 },
    );
  }
}
