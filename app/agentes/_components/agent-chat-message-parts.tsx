"use client";

import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

const URL_REGEX = /https?:\/\/[^\s"<>)]+/g;

function explorerUrlsDeep(value: unknown, out: Set<string>): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string") {
    for (const m of value.matchAll(URL_REGEX)) {
      const url = m[0];
      if (url.includes("opbnbscan.com")) out.add(url);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => explorerUrlsDeep(item, out));
    return;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>))
      explorerUrlsDeep(v, out);
  }
}

export function explorerUrlsFromJsonValue(value: unknown): string[] {
  const acc = new Set<string>();
  explorerUrlsDeep(value, acc);
  return [...acc];
}

export function trailingTextPartIndex(parts: UIMessage["parts"]): number {
  const list = parts ?? [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.type === "text") return i;
  }
  return -1;
}

function ToolExplorerLinksJson({ payload }: { payload: unknown }) {
  const urls = explorerUrlsFromJsonValue(payload);
  if (!urls.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {urls.map((href) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          translate="no"
          className="inline-flex rounded-md border border-[#f0b90b]/30 bg-[#f0b90b]/10 px-2 py-1 text-[11px] font-medium text-[#fcd535] underline-offset-4 hover:text-[#ffef9d] hover:underline"
        >
          Ver opBNBScan
        </a>
      ))}
    </div>
  );
}

export function AssistantPartRenderer(props: {
  part: NonNullable<UIMessage["parts"]>[number];
  idx: number;
  animateText: boolean;
}) {
  const { part, idx, animateText } = props;
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
      body = part.errorText ?? "";
    } else if (part.state === "input-available") {
      body = `Entrada lista:\n${JSON.stringify(part.input, null, 2)}`;
    } else if (part.state === "input-streaming") {
      body = "Entrada en streaming…";
    } else {
      body = `Estado: ${part.state}`;
    }

    let outputForExplorer: unknown;
    if (part.state === "output-available") outputForExplorer = part.output;

    return (
      <div
        key={key}
        className="rounded-lg border border-border/80 bg-secondary/55 px-3 py-2 font-mono text-xs text-muted-foreground shadow-inner"
      >
        <p className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#f0b90b]/90">
          {title}
        </p>
        {part.state === "output-available" && outputForExplorer ? (
          <ToolExplorerLinksJson payload={outputForExplorer} />
        ) : null}
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
