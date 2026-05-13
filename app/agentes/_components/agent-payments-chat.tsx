"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { MessageSquare } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";

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
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AGENT_TOOL_PROPOSE_SEND_TBNB } from "@/lib/agent-tools";
import { cn } from "@/lib/utils";

import {
  AssistantPartRenderer,
  trailingTextPartIndex,
} from "@/app/agentes/_components/agent-chat-message-parts";
import type { DemoScenario } from "@/lib/agent-demo-prompts";

type PendingSendProposal =
  | {
      toolCallId: string;
      to: string;
      amountHuman: string;
      flow: string;
      validationSummary: string;
      fromTreasury?: string;
    }
  | null;

function findPendingSendProposal(messages: UIMessage[]): PendingSendProposal {
  for (let mi = messages.length - 1; mi >= 0; mi -= 1) {
    const m = messages[mi];
    if (m.role !== "assistant") continue;
    const parts = [...(m.parts ?? [])].reverse();
    for (const part of parts) {
      if (!isToolUIPart(part)) continue;
      if (getToolName(part) !== AGENT_TOOL_PROPOSE_SEND_TBNB) continue;
      if (part.state !== "output-available") continue;
      const out = part.output as Record<string, unknown> | undefined;
      if (
        !out ||
        out.status !== "awaiting_user_confirmation" ||
        typeof out.to !== "string" ||
        typeof out.amountHuman !== "string" ||
        typeof out.flow !== "string" ||
        typeof out.validationSummary !== "string"
      ) {
        continue;
      }
      const toolCallId = part.toolCallId;
      if (typeof toolCallId !== "string" || toolCallId.length === 0) continue;
      const fromTreasury =
        typeof out.fromTreasury === "string" && out.fromTreasury.length > 0
          ? out.fromTreasury
          : undefined;
      return {
        toolCallId,
        to: out.to,
        amountHuman: out.amountHuman,
        flow: out.flow,
        validationSummary: out.validationSummary,
        fromTreasury,
      };
    }
  }
  return null;
}

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
  const { address, isConnected } = useAccount();

  const [dismissedProposalToolCallIds, setDismissedProposalToolCallIds] =
    useState<string[]>([]);

  const dismissedProposalSet = useMemo(
    () => new Set(dismissedProposalToolCallIds),
    [dismissedProposalToolCallIds],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        body: {
          ...(scenario ? { scenario } : {}),
          ...(isConnected && address
            ? { browserWalletAddress: address }
            : {}),
        },
      }),
    [api, scenario, isConnected, address],
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

  const modalSendProposal = useMemo((): PendingSendProposal => {
    if (isGenerating) return null;
    const raw = findPendingSendProposal(messages);
    if (!raw) return null;
    if (dismissedProposalSet.has(raw.toolCallId)) return null;
    return raw;
  }, [messages, isGenerating, dismissedProposalSet]);

  const handleApproveSend = () => {
    if (!modalSendProposal) return;
    setDismissedProposalToolCallIds((prev) =>
      prev.includes(modalSendProposal.toolCallId)
        ? prev
        : [...prev, modalSendProposal.toolCallId],
    );
    const { to, amountHuman, flow } = modalSendProposal;
    void sendMessage({
      text: `[Usuario OK envío tBNB]\nAutorizo la transferencia desde la tesorería del agente. Ejecutá sendTBnb con to exactamente "${to}", amountHuman exactamente "${amountHuman}" y flow "${flow}".`,
    });
  };

  const handleRejectSend = () => {
    if (modalSendProposal) {
      setDismissedProposalToolCallIds((prev) =>
        prev.includes(modalSendProposal.toolCallId)
          ? prev
          : [...prev, modalSendProposal.toolCallId],
      );
    }
    void sendMessage({
      text: "[Usuario rechaza] No autorizo este envío de tBNB en este momento.",
    });
  };

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
      <Dialog
        open={modalSendProposal !== null}
        onOpenChange={(next) => {
          if (!next && modalSendProposal) {
            setDismissedProposalToolCallIds((prev) =>
              prev.includes(modalSendProposal.toolCallId)
                ? prev
                : [...prev, modalSendProposal.toolCallId],
            );
          }
        }}
      >
        <DialogContent className="border-[#272b36] bg-[#12151c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#f4f6fa]">
              Confirmar envío · tBNB
            </DialogTitle>
            <div className="space-y-2 pt-2 text-[#aab3c5]">
              <p>
                El agente propone debitar la tesorería servidor en opBNB
                testnet. Revisá los datos antes de autorizar.
              </p>
              {modalSendProposal ? (
                <ul className="list-disc space-y-1 pl-4 text-[13px]">
                  <li>
                    Monto:&nbsp;
                    <span className="font-mono">{modalSendProposal.amountHuman}</span>
                    &nbsp;tBNB
                  </li>
                  <li>
                    Clasificación:&nbsp;
                    <span className="font-mono">{modalSendProposal.flow}</span>
                  </li>
                  {modalSendProposal.fromTreasury ? (
                    <li className="break-all font-mono text-[11px] text-[#8b929e]">
                      Desde tesorería: {modalSendProposal.fromTreasury}
                    </li>
                  ) : null}
                  <li className="break-all font-mono text-[11px] text-[#8b929e]">
                    Destino: {modalSendProposal.to}
                  </li>
                </ul>
              ) : null}
              <p className="text-[12px] leading-relaxed text-[#aab3c5]">
                {modalSendProposal?.validationSummary}
              </p>
            </div>
          </DialogHeader>
          <DialogFooter className="-mx-0 border-0 bg-transparent px-0 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => handleRejectSend()}>
              Rechazar
            </Button>
            <Button
              type="button"
              className="bg-[#f0b90b] text-[#0c0e12] hover:bg-[#fcd535]"
              onClick={() => handleApproveSend()}
            >
              Autorizar envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                          return parts.map((part, i) => (
                            <AssistantPartRenderer
                              key={`p-${i}`}
                              part={part}
                              idx={i}
                              animateText={Boolean(
                                isGenerating &&
                                  message.role === "assistant" &&
                                  message.id === streamingAssistantId &&
                                  i === tailIdx &&
                                  part.type === "text",
                              )}
                            />
                          ));
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
          placeholder={textareaPlaceholder ?? ""}
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
