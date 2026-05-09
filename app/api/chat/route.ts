import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Streaming mínimo con Vercel AI SDK (`streamText`).
 * Respuestas deterministas si falta `OPENAI_API_KEY` para no tirar builds en CI.
 */
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY ausente — configura secreto servidor (.env.local / Vercel) para habilitar el modelo.",
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
          "Se espera campo `messages: ModelMessage[]` compatible con `@ai-sdk` / Vercel AI SDK.",
      },
      { status: 412 },
    );
  }

  const rawMessages = (parsed as { messages: unknown[] }).messages;
  if (rawMessages.length === 0) {
    return Response.json(
      { error: "messages no puede estar vacío." },
      { status: 412 },
    );
  }

  const modelMessages = rawMessages as ModelMessage[];

  try {
    const openaiProvider = createOpenAI({ apiKey });
    const result = streamText({
      model: openaiProvider.chat("gpt-4o-mini"),
      messages: modelMessages,
    });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[api/chat]", err);
    return Response.json({ error: "Error interno al iniciar modelo." }, { status: 500 });
  }
}
