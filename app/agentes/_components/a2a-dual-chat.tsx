"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AssistantPartRenderer,
  trailingTextPartIndex,
} from "@/app/agentes/_components/agent-chat-message-parts";
import type { SuggestionChip } from "@/app/agentes/_components/agent-payments-chat";
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
import {
  A2A_RELAY_ALICIA_TO_JUAN_PREFIX,
  A2A_RELAY_JUAN_TO_ALICIA_PREFIX,
} from "@/lib/a2a-dual-prompts";
import {
  A2A_DUAL_TOOL_PROPOSE_PAYMENT,
  A2A_DUAL_TOOL_SEND_SETTLEMENT,
  A2A_DUAL_TOOL_SUBMIT_DELIVERABLE,
} from "@/lib/a2a-dual-tools";
import { cn } from "@/lib/utils";

const API = "/api/agents/execute";

type PendingProposal =
  | {
      toolCallId: string;
      amountHuman: string;
      to: string;
      validationSummary: string;
    }
  | null;

function fingerprint(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(Date.now());
  }
}

function findPendingProposal(messages: UIMessage[]): PendingProposal {
  for (let mi = messages.length - 1; mi >= 0; mi -= 1) {
    const m = messages[mi];
    if (m.role !== "assistant") continue;
    const parts = [...(m.parts ?? [])].reverse();
    for (const part of parts) {
      if (!isToolUIPart(part)) continue;
      if (getToolName(part) !== A2A_DUAL_TOOL_PROPOSE_PAYMENT) continue;
      if (part.state !== "output-available") continue;
      const out = part.output as Record<string, unknown> | undefined;
      if (
        !out ||
        out.status !== "awaiting_user_confirmation" ||
        typeof out.amountHuman !== "string" ||
        typeof out.to !== "string" ||
        typeof out.validationSummary !== "string"
      ) {
        continue;
      }
      const toolCallId = part.toolCallId;
      if (typeof toolCallId !== "string" || toolCallId.length === 0) continue;
      return {
        toolCallId,
        amountHuman: out.amountHuman,
        to: out.to,
        validationSummary: out.validationSummary,
      };
    }
  }
  return null;
}

function extractToolOutputs(
  message: UIMessage | undefined,
  toolName: string,
): unknown[] {
  if (!message || message.role !== "assistant") return [];
  const out: unknown[] = [];
  for (const part of message.parts ?? []) {
    if (!isToolUIPart(part)) continue;
    if (getToolName(part) !== toolName) continue;
    if (part.state === "output-available") out.push(part.output);
  }
  return out;
}

function ConversationColumn(props: {
  title: string;
  subtitle?: string;
  emptyTitle: string;
  emptyDesc?: string;
  messages: UIMessage[];
  isGenerating: boolean;
  streamingAssistantId: string | undefined;
}) {
  const { title, subtitle, emptyTitle, emptyDesc, messages, isGenerating, streamingAssistantId } =
    props;

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl",
        "border border-[#272b36] bg-[#12151c]",
        "shadow-[0_22px_50px_-30px_rgba(0,0,0,0.85)] ring-1 ring-[#f0b90b]/[0.07]",
      )}
    >
      <header className="shrink-0 border-b border-[#272b36] px-3 py-2">
        <p className="font-semibold tracking-tight text-[#f4f6fa]">{title}</p>
        {subtitle ? (
          <p className="text-[11px] leading-snug text-[#8b929e]">{subtitle}</p>
        ) : null}
      </header>
      <Conversation className="relative flex min-h-0 max-h-[min(70vh,640px)] w-full flex-1 flex-col overflow-hidden rounded-b-2xl bg-[inherit] md:max-h-none">
        <ConversationContent
          scrollClassName="min-h-0 overscroll-y-contain [scrollbar-gutter:stable]"
          className={cn(
            "min-h-0 flex-1 pb-12 pt-2",
            messages.length === 0 && "flex flex-1 flex-col justify-center gap-6 py-4",
          )}
        >
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <MessageSquare className="mx-auto size-10 text-muted-foreground opacity-70" />
              }
              title={emptyTitle}
              description={emptyDesc}
              className="max-w-xs shrink-0 self-center px-2"
            />
          ) : (
            <div className="flex flex-col gap-6">
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
                            <p key={i} className="whitespace-pre-wrap text-[14px] leading-relaxed">
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
          )}
        </ConversationContent>
        {messages.length > 0 ? (
          <>
            <ConversationDownload
              messages={messages}
              className="size-9 border-[#272b36] bg-background/95 shadow-md backdrop-blur-sm"
              aria-label="Descargar conversación Markdown"
            />
            <ConversationScrollButton
              aria-label="Últimos mensajes"
              className="border-[#272b36] bg-background/95 shadow-md backdrop-blur-sm"
            />
          </>
        ) : null}
      </Conversation>
    </div>
  );
}

export type A2aDualChatShellProps = {
  lead?: ReactNode;
  suggestions?: SuggestionChip[];
};

/** Dos chats lado a lado: Juan (input usuario) ↔ Alicia (tesorería, confirmación UX). Relay + modal de liquidación. */
export function A2aDualChatShell({ lead, suggestions }: A2aDualChatShellProps) {
  const relayJuanFingerprints = useRef(new Set<string>());
  const relayAliciaTxHashes = useRef(new Set<string>());

  const sendJuanRef = useRef<((payload: { text: string }) => Promise<void>) | null>(
    null,
  );
  const sendAliciaRef =
    useRef<((payload: { text: string }) => Promise<void>) | null>(null);

  const [dismissedProposalToolCallIds, setDismissedProposalToolCallIds] = useState<
    string[]
  >([]);

  const dismissedProposalSet = useMemo(
    () => new Set(dismissedProposalToolCallIds),
    [dismissedProposalToolCallIds],
  );

  const juanTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API,
        prepareSendMessagesRequest: ({
          messages: msgList,
        }) => ({
          body: {
            scenario: "a2a",
            a2aRole: "juan",
            messages: msgList,
          },
        }),
      }),
    [],
  );

  const aliciaTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API,
        prepareSendMessagesRequest: ({
          messages: msgList,
        }) => ({
          body: {
            scenario: "a2a",
            a2aRole: "alicia",
            messages: msgList,
          },
        }),
      }),
    [],
  );

  const {
    messages: aliciaMsgs,
    sendMessage: sendAlicia,
    status: aliciaStatus,
    stop: stopAlicia,
    error: aliciaErr,
  } = useChat({
    id: "a2a-dual-alicia",
    experimental_throttle: 42,
    transport: aliciaTransport,
    onFinish: ({ message }) => {
      const outputs = extractToolOutputs(message, A2A_DUAL_TOOL_SEND_SETTLEMENT);
      for (const out of outputs) {
        const o = out as { txHash?: string; explorerUrl?: string; amountHuman?: string };
        if (!o?.txHash) continue;
        if (relayAliciaTxHashes.current.has(o.txHash)) continue;
        relayAliciaTxHashes.current.add(o.txHash);
        void sendJuanRef.current?.({
          text: `${A2A_RELAY_ALICIA_TO_JUAN_PREFIX}\ntxHash=${o.txHash}\namountHuman=${String(o.amountHuman)}\nexplorerUrl=${String(o.explorerUrl ?? "")}`,
        });
      }
    },
  });

  const {
    messages: juanMsgs,
    sendMessage: sendJuan,
    status: juanStatus,
    stop: stopJuan,
    error: juanErr,
  } = useChat({
    id: "a2a-dual-juan",
    experimental_throttle: 42,
    transport: juanTransport,
    onFinish: ({ message }) => {
      const outputs = extractToolOutputs(message, A2A_DUAL_TOOL_SUBMIT_DELIVERABLE);
      for (const out of outputs) {
        const fp = fingerprint(out);
        if (relayJuanFingerprints.current.has(fp)) continue;
        relayJuanFingerprints.current.add(fp);
        const json = `${A2A_RELAY_JUAN_TO_ALICIA_PREFIX}\n${JSON.stringify(out, null, 2)}`;
        void sendAliciaRef.current?.({ text: json });
      }
    },
  });

  useEffect(() => {
    sendAliciaRef.current = sendAlicia;
    sendJuanRef.current = sendJuan;
  }, [sendAlicia, sendJuan]);

  const aliciaStreamingId = useMemo(() => {
    const last = [...aliciaMsgs].reverse().find((m) => m.role === "assistant");
    return last?.id;
  }, [aliciaMsgs]);

  const juanStreamingId = useMemo(() => {
    const last = [...juanMsgs].reverse().find((m) => m.role === "assistant");
    return last?.id;
  }, [juanMsgs]);

  const aliciaBusy =
    aliciaStatus === "streaming" || aliciaStatus === "submitted";
  const juanBusy = juanStatus === "streaming" || juanStatus === "submitted";

  const modalProposal = useMemo((): PendingProposal => {
    if (aliciaBusy) return null;
    const raw = findPendingProposal(aliciaMsgs);
    if (!raw) return null;
    if (dismissedProposalSet.has(raw.toolCallId)) return null;
    return raw;
  }, [aliciaMsgs, aliciaBusy, dismissedProposalSet]);

  const handleApproveSettlement = () => {
    if (!modalProposal) return;
    setDismissedProposalToolCallIds((prev) =>
      prev.includes(modalProposal.toolCallId) ? prev : [...prev, modalProposal.toolCallId],
    );
    void sendAlicia({
      text: `[Usuario OK pago]\nConfirmo liquidar contra tesorería (autotransferencia demo). Ejecutá sendSettlementTBnb con amountHuman exactamente igual a "${modalProposal.amountHuman}".`,
    });
  };

  const handleRejectSettlement = () => {
    if (modalProposal) {
      setDismissedProposalToolCallIds((prev) =>
        prev.includes(modalProposal.toolCallId) ? prev : [...prev, modalProposal.toolCallId],
      );
    }
    void sendAlicia({
      text: "[Usuario rechaza] No autorizo esta liquidación en este momento.",
    });
  };

  const submitJuanPrompt = async ({ text }: PromptInputMessage) => {
    const t = text.trim();
    if (!t.length || juanBusy) return;
    await sendJuan({ text: t });
  };

  async function chipPrompt(prompt: string) {
    if (juanBusy) return;
    await sendJuan({ text: prompt.trim() });
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 pb-8">
      <Dialog
        open={modalProposal !== null}
        onOpenChange={(next) => {
          if (!next && modalProposal) {
            setDismissedProposalToolCallIds((prev) =>
              prev.includes(modalProposal.toolCallId)
                ? prev
                : [...prev, modalProposal.toolCallId],
            );
          }
        }}
      >
        <DialogContent className="border-[#272b36] bg-[#12151c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#f4f6fa]">Confirmar pago · Alicia</DialogTitle>
            <div className="space-y-2 pt-2 text-[#aab3c5]">
                <p>Liquidación pendiente contra la tesorería (autotransferencia opBNB testnet).</p>
                {modalProposal ? (
                  <ul className="list-disc space-y-1 pl-4 text-[13px]">
                    <li>
                      Monto:&nbsp;<span className="font-mono">{modalProposal.amountHuman}</span>&nbsp;tBNB
                    </li>
                    <li className="break-all font-mono text-[11px] text-[#8b929e]">
                      Dirección tesorería: {modalProposal.to}
                    </li>
                  </ul>
                ) : null}
                <p className="text-[12px] leading-relaxed text-[#aab3c5]">
                  {modalProposal?.validationSummary}
                </p>
              </div>
          </DialogHeader>
          <DialogFooter className="-mx-0 border-0 bg-transparent px-0 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => handleRejectSettlement()}>
              Rechazar
            </Button>
            <Button
              type="button"
              className="bg-[#f0b90b] text-[#0c0e12] hover:bg-[#fcd535]"
              onClick={() => handleApproveSettlement()}
            >
              Autorizar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex min-h-0 w-full max-w-[110rem] flex-1 flex-col gap-4">
        {lead ? <div className="text-sm leading-relaxed text-[#aab3c5]">{lead}</div> : null}

        {suggestions?.length ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <Button
                key={`${s.label}-${i}`}
                type="button"
                variant="outline"
                size="sm"
                disabled={juanBusy}
                className={cn(
                  "rounded-full border-[#272a32] bg-[#12151c] text-[13px] text-[#e8edf5]",
                  "hover:border-[#f0b90b]/45 hover:bg-[#1a2230]",
                )}
                onClick={() => void chipPrompt(s.prompt)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="grid min-h-[420px] flex-1 grid-cols-1 gap-4 md:min-h-[480px] md:grid-cols-2">
          <section className="flex min-h-0 flex-col gap-3">
            <ConversationColumn
              title="Juan · freelance dev"
              subtitle="Vos ordenás la cobranza simulada; sin wallet propia."
              emptyTitle="Hablá con Juan"
              emptyDesc="Pedile que cargue factura por micro‑monto tBNB; se retransmitirá a Alicia."
              messages={juanMsgs}
              isGenerating={juanBusy}
              streamingAssistantId={juanStreamingId}
            />
            <PromptInput onSubmit={submitJuanPrompt} className="relative w-full shrink-0">
              <PromptInputTextarea
                placeholder="Orden para Juan · iniciá cobranza / entrega simulada…"
                disabled={juanBusy}
                className={cn(
                  "field-sizing-content min-h-[7rem] w-full resize-none rounded-xl pb-14 pr-[3.25rem]",
                  "border-[#2b3344] bg-background/98 text-base leading-relaxed placeholder:text-muted-foreground/85 md:text-[15px]",
                )}
              />
              <PromptInputSubmit
                status={juanStatus}
                onStop={() => stopJuan()}
                className={cn(
                  "absolute bottom-3 right-3 z-[1] size-10 rounded-xl shadow-lg",
                  "bg-[#f0b90b] text-[#0c0e12] hover:bg-[#fcd535] [&_svg]:text-current",
                )}
              />
            </PromptInput>
            {juanErr?.message?.length ? (
              <div className="text-sm text-[#fca5a5]" role="alert">
                {juanErr.message}
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-col gap-3">
            <ConversationColumn
              title="Alicia · tesorería"
              subtitle="Validación + propuesta → tu OK en modal → autotransferencia y tx en explorer."
              emptyTitle="Relay desde Juan aparece aquí"
              messages={aliciaMsgs}
              isGenerating={aliciaBusy}
              streamingAssistantId={aliciaStreamingId}
            />
            <div className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!aliciaBusy}
                className="border-[#272b36]"
                onClick={() => stopAlicia()}
              >
                Detener stream Alicia
              </Button>
            </div>
            {aliciaErr?.message?.length ? (
              <div className="text-sm text-[#fca5a5]" role="alert">
                {aliciaErr.message}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
