"use client";

/**
 * Perfil visual al frame Paper **ai-sidebar** (Scratchpad · nodo ~47I-0): ancho `--sidebar-frame-width`,
 * radio `--sidebar-frame-radius`, filas tipo `h-8`, tipo Inter (`globals.css`).
 * Si Paper MCP está conectado, podés reexportar estos tokens desde **get_computed_styles** sobre ese frame.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bot,
  ChevronDown,
  ClipboardCopy,
  MessageSquare,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Panel acordeón: ease-out perceptible (~quint); duración cercana al tope 300 ms de UI producto. */
const NAV_ACCORDION_DURATION = "duration-[280ms]";
const NAV_ACCORDION_EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

type NavTone = {
  pathname: string;
  href: string;
  /** Coincidencia exacta (sin prefijo por segmentos). */
  exact?: boolean;
};

function routeActive({ pathname, href, exact }: NavTone): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink(props: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Cierra el Sheet móvil al navegar. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = routeActive({
    pathname,
    href: props.href,
    exact: props.exact ?? false,
  });
  const Icon = props.icon;

  return (
    <Link
      href={props.href}
      onClick={props.onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "items-center flex h-8 rounded-[var(--sidebar-frame-radius)] px-3 gap-2 shrink-0 outline-none transition-colors touch-manipulation border border-transparent min-h-11 md:min-h-8",
        "focus-visible:ring-2 focus-visible:ring-[#f0b90b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-frame-bg)]",
        active
          ? "bg-[#f0b90b]/12 text-[#f0b90b] border-[#f0b90b]/20"
          : "text-[#b8bcc8] hover:text-[#f4f6fa] hover:bg-white/5 active:bg-white/[0.07]",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0 stroke-[2]",
          active ? "text-[#f0b90b]" : "text-[#8b929e]",
        )}
      />
      <span
        translate="no"
        className="text-[13px]/[1.375] font-medium font-[var(--font-sans)]"
      >
        {props.label}
      </span>
    </Link>
  );
}

function CollapsibleNavGroup({
  id,
  label,
  open,
  onOpenChange,
  children,
  className,
}: {
  id: string;
  label: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  const panelId = `${id}-panel`;

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-[var(--sidebar-frame-radius)] px-3 h-8 min-h-11 md:min-h-8 text-left outline-none transition-colors touch-manipulation",
          "text-[11px]/[1.3] uppercase tracking-wide font-semibold text-[#6e7480]",
          "hover:text-[#b8bcc8] hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[#f0b90b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-frame-bg)]",
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-[#6e7480]",
            "transition-transform motion-reduce:transition-none",
            NAV_ACCORDION_DURATION,
            NAV_ACCORDION_EASE,
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        <span className="font-[var(--font-sans)]">{label}</span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] motion-reduce:transition-none",
          NAV_ACCORDION_DURATION,
          NAV_ACCORDION_EASE,
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden pb-1" inert={open ? undefined : true}>
          <div
            className={cn(
              "flex flex-col gap-1 pt-1 motion-reduce:transition-none",
              "transition-[opacity,transform]",
              NAV_ACCORDION_DURATION,
              NAV_ACCORDION_EASE,
              open
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 motion-reduce:translate-y-0",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export type AgentSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  /**
   * Drawer móvil: cantos sólo derecha pegados al viewport; escritorio usar `frame` (tarjeta flotante).
   */
  variant?: "frame" | "drawerEdge";
};

export function AgentSidebar({
  className,
  onNavigate,
  variant = "frame",
}: AgentSidebarProps) {
  const [appsOpen, setAppsOpen] = useState(true);
  const [agentesOpen, setAgentesOpen] = useState(true);
  const [workflowsOpen, setWorkflowsOpen] = useState(true);

  const navStackClass =
    "flex flex-col gap-4 min-h-0 overscroll-contain pb-8 pt-3";

  return (
    <div
      translate="no"
      data-slot="agent-sidebar-root"
      className={cn(
        "flex flex-col antialiased text-[#b8bcc8]",
        variant === "frame"
          ? [
              "min-h-0 w-[var(--sidebar-frame-width)] max-w-full shrink-0 flex-1",
              "rounded-[var(--sidebar-frame-radius)]",
              "[background-color:var(--sidebar-frame-bg)]",
              "[border-width:1px] [border-color:var(--sidebar-frame-border)] [border-style:solid]",
              "[box-shadow:var(--sidebar-frame-shadow)]",
              "isolate overflow-hidden overflow-x-hidden",
            ]
          : [
              "min-h-svh max-h-none w-[min(100vw,286px)] shrink-0 sm:max-w-none",
              "rounded-none rounded-br-[var(--sidebar-frame-radius)] rounded-tr-[var(--sidebar-frame-radius)]",
              "[background-color:var(--sidebar-frame-bg)]",
              "border-[var(--sidebar-frame-border)] border-y border-r border-l-0",
            ],
        className,
      )}
    >
      <div className="shrink-0 border-b border-[#272b36]/80 px-3 pb-3 pt-3">
        <div className="flex h-10 w-full items-center gap-2.5 rounded-[var(--sidebar-frame-radius)] border border-transparent px-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md shadow-[inset_0_0_0_1px_rgba(240,185,11,0.25)] bg-[#141923] ring-1 ring-white/10"
            aria-hidden
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#f0b90b] font-[var(--font-sans)]">
              AP
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px]/[1.4] font-semibold text-[#f4f6fa] font-[var(--font-sans)] truncate">
              Agent Pay
            </p>
            <p className="text-[11px]/[1.3] font-medium text-[#6e7480] font-[var(--font-sans)] truncate">
              opBNB
            </p>
          </div>
          <ClipboardCopy
            aria-hidden
            className="size-[14px] text-[#5c6370] opacity-70 hidden sm:block shrink-0"
          />
        </div>
      </div>

      <nav
        className="basis-0 flex-1 overflow-y-auto px-3 pb-3 overscroll-contain"
        aria-label="Navegación principal"
      >
        <div className={navStackClass}>
          <CollapsibleNavGroup
            id="nav-apps"
            label="Apps"
            open={appsOpen}
            onOpenChange={setAppsOpen}
          >
            <SidebarLink
              href="/wallet"
              label="Wallet"
              icon={Wallet}
              exact
              onNavigate={onNavigate}
            />
          </CollapsibleNavGroup>

          <CollapsibleNavGroup
            id="nav-agentes"
            label="Agentes"
            open={agentesOpen}
            onOpenChange={setAgentesOpen}
          >
            <SidebarLink
              href="/agentes/chat"
              label="Chat"
              icon={MessageSquare}
              exact
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/agentes/a2c"
              label="A2C – Agent to Consumer"
              icon={Bot}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/agentes/a2b"
              label="A2B – Agent to Business"
              icon={Bot}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/agentes/a2a"
              label="A2A – Agent to Agent"
              icon={Bot}
              onNavigate={onNavigate}
            />
          </CollapsibleNavGroup>

          <CollapsibleNavGroup
            id="nav-workflows"
            label="Workflows"
            open={workflowsOpen}
            onOpenChange={setWorkflowsOpen}
          >
            <SidebarLink
              href="/workflows/a2a"
              label="A2A · diagrama"
              icon={Workflow}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/workflows/a2b"
              label="A2B · diagrama"
              icon={Workflow}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/workflows/a2c"
              label="A2C · diagrama"
              icon={Workflow}
              onNavigate={onNavigate}
            />
          </CollapsibleNavGroup>
        </div>
      </nav>
    </div>
  );
}
