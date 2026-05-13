"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { type State, WagmiProvider } from "wagmi";

import { wagmiConfig } from "@/lib/wagmi";

type Web3ProvidersProps = {
  children: React.ReactNode;
  /** Desde `cookieToInitialState` en el layout (guía SSR wagmi). */
  initialState?: State;
};

export function Web3Providers({
  children,
  initialState,
}: Web3ProvidersProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000 },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
