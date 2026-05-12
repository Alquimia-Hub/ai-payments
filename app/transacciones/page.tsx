import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transacciones" };

export default function TransaccionesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <h1 className="text-3xl font-bold text-[#f4f6fa]">Transacciones</h1>
    </div>
  );
}
