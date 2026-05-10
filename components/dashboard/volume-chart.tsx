"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

import type { VolumePoint } from "@/lib/mock-demo-data";
import { mockVolumeSeries } from "@/lib/mock-demo-data";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type VolumeChartProps = {
  data?: VolumePoint[];
  className?: string;
};

/**
 * Serie USDT volumen demo — cuando exista indexer, sólo cambia la fuente de `data`.
 */
export function VolumeChart({ data = mockVolumeSeries(), className }: VolumeChartProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section
      className={cn(
        "rounded-2xl border border-[#2a3344] bg-[#11161f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-5 sm:p-6",
        className,
      )}
      aria-labelledby="volume-heading"
    >
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="volume-heading"
            className="text-lg font-semibold tracking-tight text-[#f4f6fa] font-[var(--font-sans)]"
          >
            Volumen USDT enviado por agentes
          </h2>
          <p className="mt-1 text-sm text-[#979fb0] font-[var(--font-sans)]">
            Serie agregada de demostración (reemplazar con datos on‑chain cuando existan).
          </p>
        </div>
      </header>
      <div className="min-h-[300px] w-full [&_.recharts-surface]:outline-none [&_.recharts-surface:focus-visible]:ring-2 [&_.recharts-surface:focus-visible]:ring-[#f0b90b]/70 [&_.recharts-cartesian-axis-tick_text]:tabular-nums">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            accessibilityLayer
            margin={{ left: 4, right: 16, bottom: 0, top: 8 }}
          >
            <defs>
              <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0b90b" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#f0b90b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="5 10"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8f97a9", fontSize: 11 }}
              tickMargin={12}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "#8f97a9", fontSize: 11 }}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("es-ES", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(v))
              }
              width={74}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#171c27",
                border: "1px solid rgba(240,185,11,0.35)",
                borderRadius: 10,
              }}
              labelStyle={{
                fontSize: 12,
                color: "#cdd3de",
              }}
              itemStyle={{
                fontSize: 13,
                color: "#f0b90b",
                fontVariantNumeric: "tabular-nums",
              }}
              formatter={(value) =>
                money.format(Number(value ?? 0))
              }
            />
            <Area
              isAnimationActive={!reduceMotion}
              type="monotone"
              dataKey="usdt"
              stroke="#f0b90b"
              strokeWidth={2}
              fill="url(#volFill)"
              dot={false}
              activeDot={{ r: 4, stroke: "#fef3c7", strokeWidth: 2 }}
              name="USDT enviados"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
