"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { opBNBMainnet, opBNBTestnet } from "@/lib/opbnb";

/** Panel wallet — sólo ejecuta después de hidratar cliente (wagmi hooks). */
export function WalletPanel() {
  const { chainId, status, address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();

  const short =
    address && `${address.slice(0, 6)}…${address.slice(address.length - 4)}`;

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-[#2a3344] bg-[#11161f] p-6 text-[#e8eaef] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[#f4f6fa]">
          Wallet · opBNB
        </h1>
        <p className="mt-1 text-sm text-[#97a2b9]">
          Usa wallets inyectados (MetaMask, Rabby…); sin acceso a globals fuera del cliente.
        </p>
      </header>

      <Separator className="bg-[#272b36]" />

      {!isConnected ? (
        <div className="flex flex-col gap-2">
          <p className="mb-2 text-sm text-[#bdc6d9]">Conectar</p>
          {connectors.slice(0, 5).map((c) => (
            <Button
              key={c.uid}
              type="button"
              variant="outline"
              className="justify-start border-[#394355] bg-[#151b27] hover:bg-[#1c2535]"
              disabled={isPending}
              onClick={() => connect({ connector: c })}
            >
              {c.name}
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#75809a]">
              Dirección
            </p>
            <p
              translate="no"
              className="mt-2 font-mono text-sm break-all text-[#f0b90b]"
            >
              {address}
            </p>
            {short ? (
              <p className="mt-1 font-mono text-xs text-[#75809a]">{short}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => disconnect()}
          >
            Desconectar
          </Button>
        </div>
      )}

      <Separator className="bg-[#272b36]" />

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#75809a]">
          Cambiar cadena
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={chainId === opBNBMainnet.id ? "default" : "outline"}
            className={
              chainId === opBNBMainnet.id
                ? ""
                : "border-[#394355] bg-[#151b27] hover:bg-[#1c2535]"
            }
            disabled={!isConnected || switching}
            onClick={() => switchChainAsync({ chainId: opBNBMainnet.id })}
          >
            Mainnet ({opBNBMainnet.id})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={chainId === opBNBTestnet.id ? "default" : "outline"}
            className={
              chainId === opBNBTestnet.id
                ? ""
                : "border-[#394355] bg-[#151b27] hover:bg-[#1c2535]"
            }
            disabled={!isConnected || switching}
            onClick={() => switchChainAsync({ chainId: opBNBTestnet.id })}
          >
            Testnet ({opBNBTestnet.id})
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[#fca5a5]">
          {error.message}
        </p>
      ) : null}
      {status === "reconnecting" ? (
        <p className="text-sm text-[#fcd34d]">Reconectando…</p>
      ) : null}
    </div>
  );
}
