"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MainContentProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Marco derecho alineado a Paper Scratchpad · artboard `completo` · frame `main-content`
 * (MCP `get_computed_styles`): capa exterior 8px padding + overflow clip (3E5-0), columna flex
 * (3E6-0), superficie interior tipo rect 3F9-0 (radio 12px, padding sección 12px desde 3F8-0).
 * Tokens `--main-content-*` en `app/globals.css`.
 */
export function MainContent({ children, className }: MainContentProps) {
  return (
    <div
      data-slot="main-content"
      translate="no"
      className={cn(
        "relative flex min-h-0 w-full max-w-none flex-1 shrink-0 flex-col overflow-hidden",
        /* Móvil: inset Paper 8px. Escritorio: el shell repite py/pr del aside para misma altura útil que el sidebar. */
        "p-[var(--main-content-outer-padding)] md:h-full md:min-h-0 md:p-0",
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          data-slot="main-content-well"
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain",
            "rounded-[var(--main-content-well-radius)]",
            "bg-[var(--main-content-well-bg)]",
            "p-[var(--main-content-section-padding)]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
