"use client";

import * as React from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { Check, Copy, Layers, LogOut, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { opBNBMainnet, opBNBTestnet } from "@/lib/opbnb";
import { cn } from "@/lib/utils";

/** Panel wallet — wagmi (cliente). */
export function WalletPanel() {
  const { chainId, status, address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const [copied, setCopied] = React.useState(false);
  /**
   * Primer paint cliente tras hidratar: mismo valor que en SSR (`false`), luego `true`.
   * `useSyncExternalStore` + getServerSnapshot evita mismatch y cumple react-hooks/set-state-in-effect.
   */
  const hasMounted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );

  const showAccountUi = hasMounted && isConnected;

  /** Nunca listar Injected genérico ni Brave aunque el config vuelva a exponerlos. */
  const visibleConnectors = React.useMemo(
    () =>
      connectors.filter((c) => {
        const name = c.name.toLowerCase();
        const id = c.id.toLowerCase();
        if (name === "injected" || id === "injected") return false;
        if (name.includes("brave") || id.includes("brave")) return false;
        return true;
      }),
    [connectors],
  );

  const short =
    address && `${address.slice(0, 6)}…${address.slice(address.length - 4)}`;

  const copyAddress = React.useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [address]);

  return (
    <div className="mx-auto w-full max-w-lg pb-8">
      <div
        className={cn(
          "overflow-hidden rounded-[var(--sidebar-frame-radius)] border border-[#2a3344] bg-[#11161f]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_12px_42px_rgba(0,0,0,0.42),0_1px_0_rgba(0,0,0,0.35)]",
        )}
      >
        <div className="border-b border-[#272b36]/90 bg-gradient-to-r from-[#141923]/90 to-[#11161f] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-[var(--sidebar-frame-radius)] bg-[#141923] shadow-[inset_0_0_0_1px_rgba(240,185,11,0.22)] ring-1 ring-white/10"
              aria-hidden
            >
              <Wallet className="size-6 text-[#f0b90b]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-[#f4f6fa]">
                Wallet
              </h1>
              <p className="text-sm leading-relaxed text-[#97a2b9]">
                opBNB · conexión con MetaMask (extensión o app).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-5 py-6 sm:px-6 sm:py-8">
          {!showAccountUi ? (
            <section className="space-y-3" aria-labelledby="wallet-connect-heading">
              <div className="flex items-center gap-2 text-[#aab3c5]">
                <Layers className="size-4 text-[#f0b90b]/80" aria-hidden />
                <h2
                  id="wallet-connect-heading"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75809a]"
                >
                  Conectar
                </h2>
              </div>
              <ul
                className="flex flex-col gap-2.5"
                role="list"
                aria-busy={!hasMounted}
                aria-label={!hasMounted ? "Cargando opciones de conexión" : "Opciones de conexión"}
              >
                {/*
                  connectors dependen del entorno (extensiones, etc.): en SSR y en el
                  primer paint del cliente no coinciden → hidratación rota si mapeamos
                  antes de montar. Esqueleto fijo hasta hasMounted.
                */}
                {!hasMounted
                  ? [0].map((i) => (
                      <li key={`connector-skel-${i}`} aria-hidden>
                        <div
                          className={cn(
                            "h-12 w-full animate-pulse rounded-[var(--sidebar-frame-radius)] border border-[#272b36]/80 bg-[#151b27]/60",
                          )}
                        />
                      </li>
                    ))
                  : visibleConnectors.slice(0, 5).map((c) => (
                      <li key={c.uid}>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => connect({ connector: c })}
                          className={cn(
                            "h-12 w-full justify-start gap-3 rounded-[var(--sidebar-frame-radius)] border-[#394355] bg-[#151b27] px-4 text-left text-[15px] font-medium text-[#e8edf5]",
                            "transition-colors hover:border-[#f0b90b]/35 hover:bg-[#1c2535] active:bg-[#1a2230]",
                            "focus-visible:ring-2 focus-visible:ring-[#f0b90b]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11161f]",
                          )}
                        >
                          <span className="truncate">{c.name}</span>
                        </Button>
                      </li>
                    ))}
              </ul>
            </section>
          ) : (
            <section className="space-y-4" aria-labelledby="wallet-account-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id="wallet-account-heading"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75809a]"
                >
                  Cuenta
                </h2>
                <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300/95">
                  Conectado
                </span>
              </div>

              <div className="rounded-[var(--sidebar-frame-radius)] border border-[#272b36] bg-[#0f141e] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#75809a]">
                  Dirección
                </p>
                <p
                  translate="no"
                  className="mt-2 break-all font-mono text-sm leading-relaxed text-[#f0b90b]"
                >
                  {address}
                </p>
                {short ? (
                  <p className="mt-1 font-mono text-xs text-[#6e7480]">{short}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-2 border-[#394355] bg-[#151b27] text-[#e8edf5] hover:bg-[#1c2535]"
                    onClick={() => void copyAddress()}
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 text-emerald-400" aria-hidden />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" aria-hidden />
                        Copiar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-2 border-[#5c2b2b]/60 bg-[#1a1518] text-[#fca5a5] hover:bg-[#241a1a]"
                    onClick={() => disconnect()}
                  >
                    <LogOut className="size-4" aria-hidden />
                    Desconectar
                  </Button>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-3" aria-labelledby="wallet-chain-heading">
            <div className="flex items-center gap-2 text-[#aab3c5]">
              <Layers className="size-4 text-[#f0b90b]/80" aria-hidden />
              <h2
                id="wallet-chain-heading"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75809a]"
              >
                Red opBNB
              </h2>
            </div>
            <p className="text-sm text-[#97a2b9]">
              Elegí testnet para demos con tBNB o mainnet si tu wallet ya está configurada.
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                type="button"
                size="sm"
                variant={chainId === opBNBMainnet.id ? "default" : "outline"}
                className={cn(
                  "h-11 rounded-[var(--sidebar-frame-radius)] font-medium",
                  chainId === opBNBMainnet.id
                    ? "bg-[#f0b90b] text-[#0c0e12] shadow-md hover:bg-[#fcd535]"
                    : "border-[#394355] bg-[#151b27] text-[#e8edf5] hover:border-[#f0b90b]/30 hover:bg-[#1c2535]",
                )}
                disabled={!showAccountUi || switching}
                onClick={() => switchChainAsync({ chainId: opBNBMainnet.id })}
              >
                Mainnet
                <span className="ml-1.5 font-mono text-[11px] opacity-80">
                  {opBNBMainnet.id}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={chainId === opBNBTestnet.id ? "default" : "outline"}
                className={cn(
                  "h-11 rounded-[var(--sidebar-frame-radius)] font-medium",
                  chainId === opBNBTestnet.id
                    ? "bg-[#f0b90b] text-[#0c0e12] shadow-md hover:bg-[#fcd535]"
                    : "border-[#394355] bg-[#151b27] text-[#e8edf5] hover:border-[#f0b90b]/30 hover:bg-[#1c2535]",
                )}
                disabled={!showAccountUi || switching}
                onClick={() => switchChainAsync({ chainId: opBNBTestnet.id })}
              >
                Testnet
                <span className="ml-1.5 font-mono text-[11px] opacity-80">
                  {opBNBTestnet.id}
                </span>
              </Button>
            </div>
          </section>

          {error ? (
            <div
              role="alert"
              className="rounded-[var(--sidebar-frame-radius)] border border-red-500/35 bg-red-950/25 px-4 py-3 text-sm text-[#fca5a5]"
            >
              {error.message}
            </div>
          ) : null}
          {status === "reconnecting" ? (
            <p className="text-center text-sm text-[#fcd34d]">Reconectando…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
