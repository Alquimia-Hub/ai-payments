"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

import { AgentSidebar } from "@/components/sidebar/agent-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = React.useState(false);
  const closeMobile = React.useCallback(() => setNavOpen(false), []);

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#contenido-principal"
        className="fixed left-4 top-3 z-[100] -translate-y-[calc(100%+28px)] rounded-lg bg-[#f0b90b] px-3 py-1.5 text-sm font-semibold text-[#0c0e12] shadow-md transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0e12]"
      >
        Saltar al contenido
      </a>

      <aside
        className="hidden md:flex min-h-svh shrink-0 bg-[#0c0e12]"
        aria-label="Barra lateral"
      >
        <AgentSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#0c0e12] md:bg-background">
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-[#272b36] bg-[#0c0e12]/95 px-3 py-2.5 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-[#2b3342] bg-[#121821] hover:bg-[#1a2230]"
            aria-label="Abrir menú de navegación"
            aria-expanded={navOpen}
            aria-controls="nav-mobile-sheet"
            onClick={() => setNavOpen(true)}
          >
            <PanelLeft className="size-4 text-[#f0b90b]" />
          </Button>
          <span
            className="truncate text-sm font-semibold text-[#f4f6fa]"
            translate="no"
          >
            Agent Pay Demos
          </span>
        </header>

        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent
            id="nav-mobile-sheet"
            side="left"
            showCloseButton
            className="w-[min(100vw,286px)] max-w-none gap-0 border-[#272b36] bg-[#0c0e12] p-0"
          >
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <div className="max-h-svh overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),12px)]">
              <AgentSidebar
                className="w-full border-0"
                onNavigate={closeMobile}
              />
            </div>
          </SheetContent>
        </Sheet>

        <main
          id="contenido-principal"
          className="relative flex flex-1 flex-col min-w-0 bg-background px-5 py-6 sm:px-8 sm:py-10"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
