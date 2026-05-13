# Agent Pay Demos (opBNB)

## Lógica de la demo en tres capas

### 1. Experiencia de usuario (Apps + Agentes + Workflows)

- **`/`** redirige a **`/wallet`** (no hay dashboard home).
- **Wallet (`/wallet`)**: vista **wagmi** para conectar billetera y operar contra la cadena donde esté configurada la demo (ej. red de prueba), **fuera del flujo de chat con herramientas servidor**.
- **Chat tBNB (`/agentes/chat`)**: mismo agente que `POST /api/agents/execute` **sin** `scenario` en el cuerpo: el modelo elige clasificación **A2A | A2B | A2C** libremente en cada `sendTBnb` (on-chain cuando hay clave).
- **Escenarios narrativos (`/agentes/a2b`, `/agentes/a2c`)**: `POST /api/agents/execute` con **`scenario`** y **`messages`**; el servidor fuerza herramientas reales **`createAgentTools(locked)`** sobre opBNB testnet.
- **`/agentes/a2a` (dual Alicia + Juan)**: mismo endpoint con **`scenario: "a2a"`** y **`a2aRole`** (`"alicia"` **|** `"juan"`). Alicia usa la tesorería `AGENT_WALLET_PRIVATE_KEY`; Juan solo herramientas JSON simuladas. La demo liquida con **`sendSettlementTBnb`** (micro‑autotransferencia) para seguir teniendo vistas en **[testnet.opbnbscan.com](https://testnet.opbnbscan.com)** con **una sola wallet**. Opcional **`A2A_MAX_DEMO_TBNB`** (humano decimal, defecto **`0.0005`**; ver [`lib/a2a-dual-config.ts`](lib/a2a-dual-config.ts)), piso **`AGENT_TBNB_MIN_PER_TX`** (defecto **`0.00005`**, ver [`lib/agent-tbnb-amounts.ts`](lib/agent-tbnb-amounts.ts)) y tope **`AGENT_TBNB_MAX_PER_TX`** (también aplica a settlement).
- **Workflows (`/workflows/a2c`, …; `/workflows` redirige a A2C)**: diagramas estáticos (React Flow + AI Elements) alineados con los chats **A2C → A2B → A2A** y enlace al agente correspondiente.

### Endpoint mock (opcional para integraciones sin fondos)

- **`POST /api/agents/demo`**: mismo contrato `{ messages, scenario }` pero herramientas **`lib/agent-tools-mock.ts`** (sin firma ni cadena). Útil para demos sin `AGENT_WALLET_PRIVATE_KEY` o sin faucet de tBNB.

### 2. Capa IA (Vercel AI SDK)

- Conversaciones usan **`streamText` + herramientas** (`tools`) tipadas según escenario.
- Con `scenario`, el sistema combina reglas **opBNB testnet / wallet servidor** más el texto de [`getScenarioSystemPrompt`](lib/agent-demo-prompts.ts) para tono LATAM coherente con cada URL.

### 3. Qué ejecuta código realmente (tBNB nativo)

| Recurso | Rol |
| ------- | ----- |
| **tBNB** | **Gas y monto**: `sendTBnb` envía Wei nativo desde la cuenta de `AGENT_WALLET_PRIVATE_KEY`. Necesitás suficiente saldo para **gas + valor** en la misma dirección; si sólo querés mirar disponibilidad, usá **`checkTBnbBalance`**. |
| **`AGENT_TBNB_MAX_PER_TX`** | Opcional: tope de monto por transferencia (cadena decimal en unidades humanas tBNB) en [`lib/agent-tools.ts`](lib/agent-tools.ts). También se acepta el nombre legacy **`AGENT_USDT_MAX_PER_TX`** durante la migración de configs. |
| **`AGENT_TBNB_MIN_PER_TX`** | Opcional: piso por operación con valor (decimal humano tBNB). Defecto **`0.00005`**; poné **`0`** para desactivar. Ver [`lib/agent-tbnb-amounts.ts`](lib/agent-tbnb-amounts.ts) (A2A dual y mock incluidos). |

| Rutas típicas | Rol del modelo | Efecto on-chain |
| ------------- | ------------- | ---------------- |
| `/agentes/a2b`, `/agentes/a2c` → `POST /api/agents/execute` + `scenario` | Flow **bloqueado** | **Real** (`createAgentTools(lockedFlow)`) |
| `/agentes/a2a` → `scenario` + `a2aRole` | Alicia / Juan herramientas dual | **Real** simulaciones + **`sendSettlementTBnb`** (`createA2aDualTools(role)`) |
| `POST .../execute` + `scenario: "a2a"` **sin** `a2aRole` | A2A legacy | **Real** `sendTBnb`/`checkTBnbBalance` (`createAgentTools("A2A")`) |
| `/agentes/chat` → `POST /api/agents/execute` (sin `scenario`) | Cualquier flow A2A/A2B/A2C válido por pedido del usuario | **Real** (`createAgentTools()`) |
| Cualquier cliente → `POST /api/agents/demo` | Flow bloqueado por `scenario` | **Simulación** (`agent-tools-mock`) |

Para probar rápido con clave servidor: **`/agentes/chat`** → pedir balance con **`checkTBnbBalance`** sin argumentos → un **`sendTBnb`** pequeño con dirección válida en testnet.

En **`/agentes/a2b`** y **`/agentes/a2c`**, el mismo flujo legacy debe usar el **`flow`** correcto (**`A2B`**, **`A2C`**) al llamar `sendTBnb`. En **`/agentes/a2a`** el dual‑chat usa herramientas específicas (p. ej. **`sendSettlementTBnb`**) en lugar del `sendTBnb` genérico de escenario cuando `a2aRole` viene en el cuerpo; los clientes que llamen sólo **`scenario: "a2a"`** sin **`a2aRole`** siguen recibiendo el set clásico `checkTBnbBalance` + **`sendTBnb`** con **`flow: "A2A"`**.

### Escenarios (semántica de negocio)

- **A2A (Agent ↔ Agent)** — Ej.: un agente que termina trabajo y liquida automáticamente a otro.
- **A2B (Agent ↔ Business)** — Ej.: automatización ante stock bajo, facturación a proveedor, recurrentes desde tesorería.
- **A2C (Agent ↔ Consumer)** — Ej.: freelancer o familia que recibe valor y distribuye gastos recurrentes mediante reglas conversacionales.

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

- **`OPENAI_API_KEY`**: necesario para que respondan `/api/agents/execute` y `/api/agents/demo`.
- **`AGENT_WALLET_PRIVATE_KEY`**: **obligatoria para `/api/agents/execute`** (firma en servidor). Nunca la expongas con prefijo `NEXT_PUBLIC_`.
- **`NEXT_PUBLIC_OPBNB_RPC_TESTNET`**: opcional; RPC público/testnet si el default no te sirve.
- **`AGENT_TBNB_MAX_PER_TX`**: opcional; cadena decimal (ej. `1`) máximo por tx en human units tBNB.
- **`AGENT_TBNB_MIN_PER_TX`**: opcional; piso por tx/factura/liquidación (ej. `0.0001`); defecto `0.00005`, `0` desactiva.
- **`NEXT_PUBLIC_USDT_ADDRESS_OPBNB_TESTNET`**: sólo existe en código para otros usos potenciales; **las herramientas del agente no llaman ERC-20** en esta demo.

Obtené tBNB de prueba mediante el faucet habitual de la red/opBNB testnet y revisá explorer si una tx falla por fondos insuficientes.

## Estructura útil para enganchar la demo mentalmente

```text
app/
  agentes/            páginas de chat y layout
  workflows/          canvas estático por escenario (+ índice)
  api/agents/execute  streamText + createAgentTools (on-chain cuando hay pk)
  api/agents/demo     mock tools (solo simulación)
components/
  shell/             AppShell + skip link + nav móvil
  sidebar/           navegación demo
  ai-elements/       chat/workflow primitives
lib/
  agent-demo-prompts.ts  sistema por flow (scenario)
  agent-tools.ts         herramientas reales (+ createAgentTools lockedFlow)
  agent-tbnb-amounts.ts  piso mínimo tBNB por herramientas (env AGENT_TBNB_MIN_PER_TX)
  agent-tools-mock.ts    herramientas demo
```

## Deploy

Cualquier plataforma compatible con Next.js 16 sirve (Vercel, Node tras `pnpm build`, etc.). Cargá en el hosting **`OPENAI_API_KEY`** + **`AGENT_WALLET_PRIVATE_KEY`** y tené suficiente **tBNB** para gas y montos antes de esperar txs exitosas.
