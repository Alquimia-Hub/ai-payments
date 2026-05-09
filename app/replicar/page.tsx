import type { Metadata } from "next";

export const metadata: Metadata = { title: "Replicar Demo" };

export default function ReplicarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">Replicar Demo</h1>
      <p className="text-[#aab3c5] leading-relaxed">
        Reproduce localmente estos demos clonando el repo y creando `.env.local` con las mismas URLs
        RPC públicas (o tus propios endpoints gestionados) y <code translate="no" className="rounded bg-muted px-1 py-px text-[13px]">OPENAI_API_KEY</code>
        sólo cuando quieras probar el streaming <code translate="no" className="rounded bg-muted px-1 py-px text-[13px]">/api/chat</code>.
      </p>
      <section className="rounded-xl border border-[#2a3344] bg-[#11161f] p-5 text-[#d4dcea]">
        <h2 className="text-lg font-semibold text-[#f4f6fa] mb-3">Pasos rápidos</h2>
        <ol className="list-inside list-decimal space-y-3 text-[15px] leading-relaxed text-[#b8c2d9] marker:text-[#f0b90b]">
          <li>Instala dependencias: <code translate="no" className="rounded bg-[#171c29] px-1.5 py-0.5 text-sm">pnpm install</code></li>
          <li>Ejecuta dev: <code translate="no" className="rounded bg-[#171c29] px-1.5 py-0.5 text-sm">pnpm dev</code></li>
          <li>Define variables públicas opcionales (RPC / plantilla explorer).</li>
        </ol>
      </section>
    </div>
  );
}
