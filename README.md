# Agent Pay Demos (opBNB)

## Lógica de la demo en tres capas

### 1. Experiencia de usuario (Apps + Agentes + Workflows)

- **Dashboard (`/`)**: paneles demo (volumen y actividad simulados) para dar contexto sin depender de un indexador real.
- **Wallet (`/wallet`)**: vista **wagmi** para conectar billetera y operar contra la cadena donde esté configurada la demo (ej. red de prueba), **fuera del flujo de chat con herramientas mock**.
- **Chat USDT (`/agentes/chat`)**: agente enlazado a **ejecución on-chain opcional**. Si cargás las variables necesarias (`OPENAI_API_KEY`, `AGENT_WALLET_PRIVATE_KEY`, etc.), el modelo puede disparar llamadas ERC-20 **reales** sobre testnet/red configurada usando **wagmi/server** desde la API; si no hay clave servidor, ese camino simplemente no opera.
- **Escenarios narrativos (`/agentes/a2a`, `/agentes/a2b`, `/agentes/a2c`)**: tres páginas de chat que comparten una sola API (`POST /api/agents/demo`). En cada página el servidor **bloquea** el tipo de flujo (`A2A`, `A2B` o `A2C`) y expone herramientas con la misma forma que una integración real —pero ejecutando **solo la simulación** en ese endpoint— para que UX y copy coincidan con la historia sin arriesgar fondos desde esas vistas.
- **Workflows (`/workflows`, `/workflows/a2a`, …)**: diagramas estáticos (React Flow + AI Elements) que **solo ilustran** la misma tríada A2A/A2B/A2C y enlazan al chat correspondiente.

### 2. Capa IA (Vercel AI SDK)

- Conversaciones usan **`streamText` + herramientas** (`tools`) tipadas según escenario.
- El **mensaje de sistema** por página guía técnico y tonalidad (LATAM); por diseño actual no insiste ante el usuario en frases tipo “sandbox” repetidas: la narrativa debe leerse **como flujo operativo habitual del producto** mientras tanto que las garantías jurídicas/reales dependan de tus términos y del modo de ejecución que elijas exponer públicamente.

### 3. Qué ejecuta código realmente

| Rutas típicas | Rol del modelo | Efecto on-chain |
| ------------- | ------------- | ---------------- |
| `/agentes/a2a,b,c` → `POST /api/agents/demo` | Decide cuándo llamar herramientas | **Simulación** determinista (`sendUSDT` / `checkUSDTBalance` mock en `lib/agent-tools-mock.ts`) |
| `/agentes/chat` → según configuración (`/api/agents/execute` u otras) | Idem pero apuntando a stack “real” | Depende de **env**, red y políticas del contrato/token |

Las herramientas mock comparten naming y firma técnica con las reales donde aplica (`lib/agent-tools.ts` como referencia) para poder **intercambiar** implementación cuando pases de demo a staging.

### Escenarios (semántica de negocio)

- **A2A (Agent ↔ Agent)** — Ej.: un agente que termina trabajo y liquida automáticamente a otro.
- **A2B (Agent ↔ Business)** — Ej.: automatización ante stock bajo, facturación a proveedor, recurrentes SaaS desde tesorería.
- **A2C (Agent ↔ Consumer)** — Ej.: freelancer o familia que recibe valor en stablecoin y distribuye gastos/recurrentes mediante reglas conversacionales.

## Puesta en marcha

Este proyecto usa **pnpm** como gestor de paquetes (ver `package.json`).

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Otros comandos útiles:

```bash
pnpm run lint
pnpm run build
```

### Variables de entorno (orientación rápida)

- **`OPENAI_API_KEY`** (o proveedor configurado equivalente): **obligatorio** para que respondan `/api/agents/demo` y demás rutas de agente protegidas.
- **`AGENT_WALLET_PRIVATE_KEY`** y parametrización relacionada **solo para** rutas donde quieras **firma servidor** contra testnet o red que definas (`lib/wagmi.ts`, rutas execute).
- Cualquier otra secreta (URLs de RPC, claves explorador, etc.) según tus despliegues; no están hardcodeadas en las páginas de demo públicas narrativas.

## Estructura útil para enganchar la demo mentalmente

```text
app/
  agentes/          páginas de chat y layout
  workflows/        canvas estático por escenario (+ índice)
  api/agents/demo   bloque A2A/A2B/A2C + herramientas mock
components/
  shell/           AppShell + skip link + nav móvil
  sidebar/         navegación demo
  ai-elements/     primitives de UI de chat/workflow (Vercel AI Elements + xyflow donde aplica)
lib/
  agent-demo-prompts.ts   sistema por flow
  agent-tools-mock.ts     simulación de transferencias/consultas
```