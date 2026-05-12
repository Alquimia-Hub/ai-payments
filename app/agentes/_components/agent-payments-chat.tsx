"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { MessageSquare } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DemoScenario } from "@/lib/agent-demo-prompts";

export type SuggestionChip = {
  label: string;
  prompt: string;
};

export type AgentPaymentsChatProps = {
  api: string;
  scenario?: DemoScenario;
  title: string;
  lead?: ReactNode;
  emptyState: {
    title: string;
    description?: string;
  };
  textareaPlaceholder?: string;
  suggestions?: SuggestionChip[];
};

function trailingTextPartIndex(parts: UIMessage["parts"]): number {
  const list = parts ?? [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.type === "text") return i;
  }
  return -1;
}

function renderAssistantPart(
  part: UIMessage["parts"][number],
  idx: number,
  animateText: boolean,
) {
  const key = `p-${idx}`;

  if (isTextUIPart(part)) {
    return (
      <MessageResponse key={key} isAnimating={animateText}>
        {part.text}
      </MessageResponse>
    );
  }

  if (isReasoningUIPart(part)) {
    return (
      <div
        key={key}
        className="rounded-md border border-dashed border-border/80 bg-muted/40 px-2 py-1.5 text-xs italic leading-relaxed text-muted-foreground"
      >
        {part.text ?? "(sin texto de reasoning)"}
      </div>
    );
  }

  if (isToolUIPart(part)) {
    const title = getToolName(part);

    let body: string;
    if (part.state === "output-available") {
      body = JSON.stringify(part.output, null, 2);
    } else if (part.state === "output-error") {
      body = part.errorText;
    } else if (part.state === "input-available") {
      body = `Entrada lista:\n${JSON.stringify(part.input, null, 2)}`;
    } else if (part.state === "input-streaming") {
      body = "Entrada en streaming…";
    } else {
      body = `Estado: ${part.state}`;
    }

    return (
      <div
        key={key}
        className="rounded-lg border border-border/80 bg-secondary/55 px-3 py-2 font-mono text-xs text-muted-foreground shadow-inner"
      >
        <p className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#f0b90b]/90">
          {title}
        </p>
        <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-[11px] leading-snug">
          {body}
        </pre>
      </div>
    );
  }

  return (
    <pre
      key={key}
      className="max-w-full overflow-x-auto rounded-md border border-border bg-muted p-2 text-[11px]"
    >
      {JSON.stringify(part, null, 2)}
    </pre>
  );
}

/** Shell de chat AI Elements (`Conversation` + `PromptInput`): patrón de elements.ai-sdk.dev + transport Vercel. */
export function AgentPaymentsChat({
  api,
  scenario,
  title,
  lead,
  emptyState,
  textareaPlaceholder,
  suggestions,
}: AgentPaymentsChatProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        ...(scenario ? { body: { scenario } } : {}),
      }),
    [api, scenario],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
    experimental_throttle: 42,
  });

  const streamingAssistantId = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    return lastAssistant?.id;
  }, [messages]);

  const isGenerating = status === "streaming" || status === "submitted";

  async function submitMessage({ text }: PromptInputMessage): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed.length) return;
    await sendMessage({ text: trimmed });
  }

  async function submitPrompt(text: string): Promise<void> {
    await sendMessage({ text: text.trim() });
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pb-8">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-5">
      <header className="shrink-0 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">
          {title}
        </h1>
        {lead ? (
          <div className="text-sm leading-relaxed text-[#aab3c5]">{lead}</div>
        ) : null}

        {suggestions?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s, i) => (
              <Button
                key={`${s.label}-${i}`}
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating}
                className={cn(
                  "rounded-full border-[#272a32] bg-[#12151c] text-[13px] text-[#e8edf5]",
                  "hover:border-[#f0b90b]/45 hover:bg-[#1a2230]",
                )}
                onClick={() => void submitPrompt(s.prompt)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        ) : null}
      </header>

      {/* `flex-1 min-h-0`: ocupa alto disponible debajo del encabezado; el scroll vive en Conversation. */}
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl",
          "border border-[#272b36] bg-[#12151c]",
          "shadow-[0_22px_50px_-30px_rgba(0,0,0,0.85)] ring-1 ring-[#f0b90b]/[0.07]",
        )}
      >
        <Conversation className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl bg-[inherit]">
          <ConversationContent
            scrollClassName="min-h-0 overscroll-y-contain [scrollbar-gutter:stable]"
            className={cn(
              "min-h-0 flex-1 pb-24 pt-2",
              messages.length === 0 && "flex flex-1 flex-col justify-center gap-8 py-6",
            )}
          >
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="mx-auto size-12 text-muted-foreground opacity-75" />}
                title={emptyState.title}
                description={emptyState.description}
                className="max-w-sm shrink-0 self-center"
              />
            ) : (
              <>
                {/* margen inferior para no tapar contenido con los botones flotantes */}
                <div className="flex flex-col gap-8">
                  {messages.map((message) => (
                    <Message key={message.id} from={message.role}>
                      <MessageContent>
                        {(() => {
                          const parts = message.parts ?? [];
                          if (message.role === "user") {
                            return parts
                              .filter((p): p is Extract<UIMessage["parts"][number], { type: "text" }> =>
                                p.type === "text",
                              )
                              .map((p, i) => (
                                <p
                                  key={i}
                                  className="whitespace-pre-wrap text-[15px] leading-relaxed"
                                >
                                  {p.text}
                                </p>
                              ));
                          }
                          const tailIdx = trailingTextPartIndex(parts);
                          return parts.map((part, i) =>
                            renderAssistantPart(
                              part,
                              i,
                              Boolean(
                                isGenerating &&
                                  message.role === "assistant" &&
                                  message.id === streamingAssistantId &&
                                  i === tailIdx &&
                                  isTextUIPart(part),
                              ),
                            ),
                          );
                        })()}
                      </MessageContent>
                    </Message>
                  ))}
                </div>
              </>
            )}
          </ConversationContent>

          {messages.length > 0 ? (
            <>
              <ConversationDownload
                messages={messages}
                className="size-10 border-[#272b36] bg-background/95 shadow-md backdrop-blur-sm"
                aria-label="Descargar conversación como Markdown"
              />
              <ConversationScrollButton
                aria-label="Ir al último mensaje"
                className="border-[#272b36] bg-background/95 shadow-md backdrop-blur-sm"
              />
            </>
          ) : null}
        </Conversation>
      </div>

      {error?.message?.length ? (
        <div
          className="shrink-0 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-2 text-sm text-[#fca5a5]"
          role="alert"
        >
          {error.message}
        </div>
      ) : null}

      <PromptInput
        onSubmit={(m) => submitMessage(m)}
        className="relative mt-1 w-full shrink-0"
      >
        <PromptInputTextarea
          placeholder={textareaPlaceholder ?? "Escribí aquí…"}
          className={cn(
            "field-sizing-content min-h-[7.5rem] w-full resize-none rounded-xl pb-14 pr-[3.25rem]",
            "border-[#2b3344] bg-background/98 text-base leading-relaxed placeholder:text-muted-foreground/85 md:text-[15px]",
          )}
        />
        <PromptInputSubmit
          status={status}
          onStop={() => stop()}
          className={cn(
            "absolute bottom-3 right-3 z-[1] size-10 rounded-xl shadow-lg",
            "bg-[#f0b90b] text-[#0c0e12] hover:bg-[#fcd535] [&_svg]:text-current",
          )}
        />
      </PromptInput>

      </div>
    </div>
  );
}
