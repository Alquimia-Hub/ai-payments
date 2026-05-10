"use client";

/**
 * Sidebar portado desde Paper MCP (artboard `ai-sidebar`, nodo raíz **47I-0**):
 * proporciones (~255px), `rounded-[10px]`, filas `h-8`, ritmo tipo Inter — adaptado tema oscuro opBNB (#0C0E12 / #F0B90B).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardCopy,
  Home,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  Wallet,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";

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
  icon: typeof Home;
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
        "items-center flex h-8 rounded-[10px] px-3 gap-2 shrink-0 outline-none transition-colors touch-manipulation border border-transparent min-h-11 md:min-h-8",
        "focus-visible:ring-2 focus-visible:ring-[#f0b90b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0e12]",
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

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-2 px-3 pt-6 first:pt-0">
      <p className="text-[11px]/[1.3] uppercase tracking-wide font-semibold text-[#6e7480]">
        {label}
      </p>
    </div>
  );
}

export type AgentSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function AgentSidebar({ className, onNavigate }: AgentSidebarProps) {
  const navSectionClass =
    "flex flex-col gap-1 min-h-0 overscroll-contain pb-8";

  return (
    <div
      translate="no"
      className={cn(
        "flex flex-col w-[255px] min-h-0 shrink-0 antialiased bg-[#0c0e12] border-r border-[#272b36] text-[#b8bcc8]",
        className,
      )}
    >
      <div className="p-3 border-b border-[#272b36]/80 shrink-0">
        <div className="flex w-full items-center gap-2.5 rounded-[10px] h-10 px-2.5 border border-transparent">
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
        className="basis-0 flex-1 overflow-y-auto p-3 overscroll-contain"
        aria-label="Navegación principal"
      >
        <SectionHeading label="Apps" />
        <div className={navSectionClass}>
          <SidebarLink
            href="/"
            label="Home (Dashboard)"
            icon={LayoutDashboard}
            exact
            onNavigate={onNavigate}
          />
          <SidebarLink
            href="/wallet"
            label="Wallet"
            icon={Wallet}
            exact
            onNavigate={onNavigate}
          />

          <div className="mt-6">
            <SectionHeading label="Agentes" />
          </div>
          <SidebarLink
            href="/agentes/chat"
            label="Chat · USDT (agente)"
            icon={MessageSquare}
            exact
            onNavigate={onNavigate}
          />
          <SidebarLink
            href="/agentes/a2a"
            label="A2A – Agent to Agent"
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
            href="/agentes/a2c"
            label="A2C – Agent to Consumer"
            icon={Bot}
            onNavigate={onNavigate}
          />

          <div className="mt-6">
            <SectionHeading label="Workflows" />
          </div>
          <SidebarLink
            href="/workflows"
            label="Diagramas (índice)"
            icon={Workflow}
            exact
            onNavigate={onNavigate}
          />
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

          <div className="mt-6">
            <SectionHeading label="Operaciones" />
          </div>
          <SidebarLink
            href="/transacciones"
            label="Transacciones"
            icon={ListTree}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href="/replicar"
            label="Replicar Demo"
            icon={Home}
            exact
            onNavigate={onNavigate}
          />
        </div>
      </nav>
    </div>
  );
}
