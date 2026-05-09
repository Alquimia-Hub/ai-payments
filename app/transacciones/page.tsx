import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transacciones" };

export default function TransaccionesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">Transacciones</h1>
      <p className="text-[#aab3c5] leading-relaxed">
        Listado explorador / indexer dedicado llegará después; hasta entonces revisa también el dashboard
        con actividad resumida.
      </p>
    </div>
  );
}
