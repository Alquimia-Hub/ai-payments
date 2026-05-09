import { AgentActivity } from "@/components/dashboard/agent-activity";
import { VolumeChart } from "@/components/dashboard/volume-chart";

/** Home / Dashboard — volumen demo + última actividad de agentes. */
export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-[#f4f6fa] sm:text-5xl">
          Agent Pay Demos
        </h1>
        <p className="text-lg text-[#aab3c5] font-[var(--font-sans)]">
          Real autonomous payments on{" "}
          <span translate="no" className="font-semibold text-[#f0b90b]">
            opBNB
          </span>
        </p>
      </header>

      <VolumeChart />
      <AgentActivity />
    </div>
  );
}
