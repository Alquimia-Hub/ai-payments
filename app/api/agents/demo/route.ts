import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  type UIMessage,
  streamText,
  stepCountIs,
} from "ai";

import {
  type DemoScenario,
  getScenarioSystemPrompt,
  scenarioToLockedFlow,
} from "@/lib/agent-demo-prompts";
import { createMockAgentTools } from "@/lib/agent-tools-mock";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCENARIOS: DemoScenario[] = ["a2a", "a2b", "a2c"];

function isDemoScenario(value: unknown): value is DemoScenario {
  return typeof value === "string" && SCENARIOS.includes(value as DemoScenario);
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY ausente — el demo del agente requiere el modelo (wallet no necesaria).",
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
      { error: "Se espera { messages: UIMessage[], scenario: 'a2a'|'a2b'|'a2c' }." },
      { status: 412 },
    );
  }

  const scenarioRaw = (parsed as { scenario?: unknown }).scenario;
  if (!isDemoScenario(scenarioRaw)) {
    return Response.json(
      { error: "scenario debe ser 'a2a', 'a2b' o 'a2c'." },
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

  const lockedFlow = scenarioToLockedFlow(scenarioRaw);
  const mockTools = createMockAgentTools(lockedFlow);

  try {
    const provider = createOpenAI({ apiKey });
    const result = streamText({
      model: provider.chat("gpt-4o-mini"),
      system: `${getScenarioSystemPrompt(lockedFlow)}

---

Flujo demo (herramientas mock): para transferir tBNB simulado, primero **proposeSendTBnb**; solo después de que el usuario confirme (en la UI con modal o por mensaje explícito) llamá **sendTBnb** con los mismos \`to\`, \`amountHuman\` y \`flow\`.`,
      messages: await convertToModelMessages(messages),
      tools: mockTools,
      stopWhen: stepCountIs(10),
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[api/agents/demo]", err);
    return Response.json(
      { error: "Error interno del agente (streamText)." },
      { status: 500 },
    );
  }
}
