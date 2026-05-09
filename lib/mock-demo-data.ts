export type VolumePoint = {
  date: string;
  usdt: number;
};

/** Deterministic mock series (stable SSR / builds — replace with indexer later). */
export function mockVolumeSeries(): VolumePoint[] {
  return [
    { date: "2026-04-01", usdt: 128_400 },
    { date: "2026-04-08", usdt: 201_050 },
    { date: "2026-04-15", usdt: 176_220 },
    { date: "2026-04-22", usdt: 243_880 },
    { date: "2026-04-29", usdt: 298_410 },
    { date: "2026-05-06", usdt: 332_150 },
  ];
}

export type AgentTxKind = "A2A" | "A2B" | "A2C";

export type AgentActivityRow = {
  id: string;
  kind: AgentTxKind;
  amountUsdt: number;
  /** ISO-8601 timestamp */
  at: string;
  txHash: `0x${string}`;
};

export function mockAgentActivity(): AgentActivityRow[] {
  return [
    {
      id: "1",
      kind: "A2A",
      amountUsdt: 1_250.5,
      at: "2026-05-08T14:22:11.000Z",
      txHash:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    {
      id: "2",
      kind: "A2B",
      amountUsdt: 420,
      at: "2026-05-08T13:01:44.000Z",
      txHash:
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    {
      id: "3",
      kind: "A2C",
      amountUsdt: 89.99,
      at: "2026-05-08T11:55:02.000Z",
      txHash:
        "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    },
    {
      id: "4",
      kind: "A2A",
      amountUsdt: 5_000,
      at: "2026-05-07T22:10:00.000Z",
      txHash:
        "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    },
  ];
}
