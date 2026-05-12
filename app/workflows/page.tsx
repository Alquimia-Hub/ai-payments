import type { Metadata } from "next";
import Link from "next/link";

import { Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Workflows · diagramas",
  description:
    "Visualiza los flujos A2A, A2B y A2C como diagramas (React Flow · AI Elements).",
};

const cards = [
  { href: "/workflows/a2a", title: "A2A · Agent to Agent" },
  { href: "/workflows/a2b", title: "A2B · Agent to Business" },
  { href: "/workflows/a2c", title: "A2C · Agent to Consumer" },
] as const;

export default function WorkflowsIndexPage() {
  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f4f6fa]">Workflows</h1>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ href, title }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col gap-2 rounded-xl border border-[#272b36] bg-[#12151c] p-4 text-left shadow-[0_22px_50px_-30px_rgba(0,0,0,0.85)] ring-1 ring-[#f0b90b]/[0.07] transition-colors hover:border-[#f0b90b]/25 hover:ring-[#f0b90b]/20"
            >
              <span className="inline-flex items-center gap-2 text-[#f4f6fa]">
                <Workflow
                  aria-hidden
                  className="size-4 text-[#f0b90b]"
                />
                <span className="text-[15px] font-semibold leading-snug">{title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
