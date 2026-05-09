import { format, parseISO } from "date-fns";

import Link from "next/link";

import { exploreTxUrl } from "@/lib/opbnb";
import { mockAgentActivity } from "@/lib/mock-demo-data";

const amt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/**
 * Lista de actividad reciente demo — servidor render para HTML estable SEO/hidratación mínima.
 */
export function AgentActivity() {
  const rows = mockAgentActivity();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

  return (
    <section
      className="rounded-2xl border border-[#2a3344] bg-[#11161f] p-5 sm:p-6"
      aria-labelledby="activity-heading"
    >
      <header className="mb-6">
        <h2
          id="activity-heading"
          className="text-lg font-semibold tracking-tight text-[#f4f6fa] font-[var(--font-sans)]"
        >
          Agent Activity
        </h2>
        <p className="mt-1 text-sm text-[#979fb0] font-[var(--font-sans)]">
          Últimas transacciones de demostración · zona horaria: {tz}
        </p>
      </header>

      <ul role="list" className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id}>
            <article
              aria-label={`Transacción ${row.kind} por ${amt.format(row.amountUsdt)}`}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#242c3d] bg-[#0f141e] px-4 py-3 sm:px-5 sm:py-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-[#f0b90b]/30 bg-[#f0b90b]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#fde68a]">
                    {row.kind}
                  </span>
                  <span className="text-base font-semibold tabular-nums text-[#f4f6fa] font-[var(--font-sans)]">
                    {amt.format(row.amountUsdt)}{" "}
                    <span className="font-medium text-[#b8bcc8] text-sm">USDT</span>
                  </span>
                </div>
                <time
                  className="text-xs text-[#8f97a9] tabular-nums font-[var(--font-sans)]"
                  dateTime={row.at}
                >
                  {format(parseISO(row.at), "PPpp")}
                </time>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={exploreTxUrl(row.txHash)}
                  translate="no"
                  className="inline-flex items-center rounded-lg bg-[#1b2231] px-3 py-1.5 text-sm font-semibold text-[#f0b90b] outline-none transition-colors hover:bg-[#232c3f] focus-visible:ring-2 focus-visible:ring-[#f0b90b]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f141e]"
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                >
                  Ver en explorer
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
