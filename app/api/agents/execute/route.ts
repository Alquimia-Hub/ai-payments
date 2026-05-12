import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  type UIMessage,
  streamText,
  stepCountIs,
} from "ai";

import { createAgentTools } from "@/lib/agent-tools";
import {
  type DemoScenario,
  getScenarioSystemPrompt,
  scenarioToLockedFlow,
} from "@/lib/agent-demo-prompts";
import { OPBNB_TESTNET_CHAIN_ID } from "@/lib/opbnb";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCENARIOS: DemoScenario[] = ["a2a", "a2b", "a2c"];

function isDemoScenario(value: unknown): value is DemoScenario {
  return typeof value === "string" && SCENARIOS.includes(value as DemoScenario);
}

const AGENT_SYSTEM_BASE = `Eres el agente de pagos demo en **opBNB testnet** exclusivamente.

Reglas operativas:
- Solo transferís **tBNB nativo** (mensajes con valor en la transacción, 18 decimals). No uses contratos ERC-20 en estas herramientas.
- La wallet servidor firma con AGENT_WALLET_PRIVATE_KEY cuando existe: **el mismo saldo en tBNB paga gas y el monto enviado**. Si falta fondo suficiente (gas + valor), explicá cómo usar faucet testnet sin inventar tasas cambiarias fuera del contexto.
- Antes de mover montos grandes conviene **checkTBnbBalance** sobre la tesorería 0x que corresponda o la cuenta agente cuando no aclaren dirección.
- **sendTBnb** requiere destinatario 0x, **amountHuman** en tBNB y flow uno de A2A | A2B | A2C (clasificación sólo auditoría/logs del usuario). Si la sesión trae \`scenario\` en el cuerpo, **solo** vale ese flow para la página actual.
- Opcional: \`AGENT_TBNB_MAX_PER_TX\` limita cuántos tBNB puede enviar una sola herramienta (string decimal humano).
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
      {
        error:
          "Se espera cuerpo { messages: UIMessage[], scenario?: 'a2a'|'a2b'|'a2c' }.",
      },
      { status: 412 },
    );
  }

  const scenarioRaw = (parsed as { scenario?: unknown }).scenario;
  if (scenarioRaw !== undefined && !isDemoScenario(scenarioRaw)) {
    return Response.json(
      { error: "scenario debe ser 'a2a', 'a2b' o 'a2c' si se envía." },
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

  const lockedFlow =
    scenarioRaw !== undefined ? scenarioToLockedFlow(scenarioRaw) : undefined;
  const tools = createAgentTools(lockedFlow);
  const system =
    lockedFlow === undefined
      ? AGENT_SYSTEM_BASE
      : `${AGENT_SYSTEM_BASE}\n\n---\n\n${getScenarioSystemPrompt(lockedFlow)}`;

  try {
    const provider = createOpenAI({ apiKey });
    const result = streamText({
      model: provider.chat("gpt-4o-mini"),
      system,
      messages: await convertToModelMessages(messages),
      tools,
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
