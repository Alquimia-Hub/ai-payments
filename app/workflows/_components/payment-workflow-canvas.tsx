"use client";

import { Canvas } from "@/components/ai-elements/canvas";
import { Controls } from "@/components/ai-elements/controls";
import { Edge } from "@/components/ai-elements/edge";
import {
  Node,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node";
import { Panel } from "@/components/ai-elements/panel";
import type { DemoScenario } from "@/lib/agent-demo-prompts";
import { cn } from "@/lib/utils";
import type { Edge as RFEdge, Node as RFNode } from "@xyflow/react";
import {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type NodeProps,
} from "@xyflow/react";
import Link from "next/link";

type WorkflowScenarioNodeData = Record<string, unknown> & {
  title: string;
  description: string;
  handles: {
    target: boolean;
    source: boolean;
  };
};

type WorkflowScenarioFlowNode = RFNode<WorkflowScenarioNodeData, "workflowScenario">;

function WorkflowScenarioNode({ data }: NodeProps<WorkflowScenarioFlowNode>) {
  return (
    <Node
      handles={data.handles}
      className={cn(
        "border border-[#f0b90b]/30 bg-[#12151c] shadow-lg ring-1 ring-[#f0b90b]/10",
        "size-fit! max-w-[220px] min-w-[180px]",
      )}
      size="sm"
    >
      <NodeHeader className="border-[#272b36] bg-[#1a1d24] px-3! py-3!">
        <NodeTitle className="text-[13px] text-[#f4f6fa]">{data.title}</NodeTitle>
        <NodeDescription className="text-xs leading-snug text-muted-foreground">
          {data.description}
        </NodeDescription>
      </NodeHeader>
    </Node>
  );
}

const WORKFLOW_NODE_TYPES = { workflowScenario: WorkflowScenarioNode };
const EDGE_TYPES = { animated: Edge.Animated };

const A2A_NODES: RFNode[] = [
  {
    id: "a2a-juan",
    type: "workflowScenario",
    position: { x: 0, y: 100 },
    data: {
      title: "Juan presenta el cobro",
      description:
        "El freelancer deja registrado qué entregó, cuánto cobra en tBNB y un resumen. Esa información viaja automáticamente hacia quien paga.",
      handles: { target: false, source: true },
    },
  },
  {
    id: "a2a-alicia",
    type: "workflowScenario",
    position: { x: 290, y: 100 },
    data: {
      title: "Alicia y la persona usuaria",
      description:
        "Quien administra la tesorería revisa el pedido y arma la liquidación. La persona usuaria ve un aviso en pantalla y debe confirmar antes de que se mueva el dinero.",
      handles: { target: true, source: true },
    },
  },
  {
    id: "a2a-chain",
    type: "workflowScenario",
    position: { x: 590, y: 100 },
    data: {
      title: "Pago en la red de prueba",
      description:
        "Solo después de que la persona usuaria confirme, el pago queda registrado en la red de prueba y puede verse en el explorador público. En esta demo todo sale de una misma cuenta para simplificar.",
      handles: { target: true, source: false },
    },
  },
];

const A2A_EDGES: RFEdge[] = [
  { id: "a2a-e1", source: "a2a-juan", target: "a2a-alicia", type: "animated" },
  { id: "a2a-e2", source: "a2a-alicia", target: "a2a-chain", type: "animated" },
];

const A2B_NODES: RFNode[] = [
  {
    id: "a2b-api",
    type: "workflowScenario",
    position: { x: 0, y: 100 },
    data: {
      title: "El agente del negocio",
      description:
        "Atiende el pedido del equipo: por ejemplo stock bajo, compra a proveedor o pago recurrente. En la app está dedicado a pagos de negocio a negocio.",
      handles: { target: false, source: true },
    },
  },
  {
    id: "a2b-tools",
    type: "workflowScenario",
    position: { x: 290, y: 100 },
    data: {
      title: "Revisión y envío",
      description:
        "Puede consultar cuánto hay disponible en la tesorería y, si alcanza, enviar el tBNB acordado al proveedor, respetando los montos mínimos de la demo.",
      handles: { target: true, source: true },
    },
  },
  {
    id: "a2b-supplier",
    type: "workflowScenario",
    position: { x: 590, y: 100 },
    data: {
      title: "Proveedor",
      description:
        "Recibe el pago en moneda de prueba (tBNB) en la red opBNB. El costo de la operación sale de la misma cuenta que envía el valor.",
      handles: { target: true, source: false },
    },
  },
];

const A2B_EDGES: RFEdge[] = [
  { id: "a2b-e1", source: "a2b-api", target: "a2b-tools", type: "animated" },
  { id: "a2b-e2", source: "a2b-tools", target: "a2b-supplier", type: "animated" },
];

const A2C_NODES: RFNode[] = [
  {
    id: "a2c-income",
    type: "workflowScenario",
    position: { x: 40, y: 150 },
    data: {
      title: "Llega el dinero",
      description:
        "La persona cuenta qué ingresó (sueldo, remesa, etc.) y a qué necesidades quiere destinarlo.",
      handles: { target: false, source: true },
    },
  },
  {
    id: "a2c-personal-agent",
    type: "workflowScenario",
    position: { x: 290, y: 150 },
    data: {
      title: "El agente personal",
      description:
        "Organiza el reparto: puede mirar saldos y enviar varias partes del ingreso a distintas cuentas que la persona definió (salud, familia, servicios).",
      handles: { target: true, source: true },
    },
  },
  {
    id: "a2c-health",
    type: "workflowScenario",
    position: { x: 570, y: 0 },
    data: {
      title: "Salud",
      description:
        "Una parte puede ir a mutual, medicina prepaga o gastos médicos recurrentes.",
      handles: { target: true, source: false },
    },
  },
  {
    id: "a2c-family",
    type: "workflowScenario",
    position: { x: 570, y: 150 },
    data: {
      title: "Hogar o hijos",
      description:
        "Otra parte puede destinarse a cuentas familiares, hijos o apoyo en el interior.",
      handles: { target: true, source: false },
    },
  },
  {
    id: "a2c-services",
    type: "workflowScenario",
    position: { x: 570, y: 300 },
    data: {
      title: "Servicios",
      description:
        "Suscripciones, luz, internet u otros pagos habituales, cada uno como un envío aparte si hace falta.",
      handles: { target: true, source: false },
    },
  },
];

const A2C_EDGES: RFEdge[] = [
  { id: "a2c-e1", source: "a2c-income", target: "a2c-personal-agent", type: "animated" },
  {
    id: "a2c-e2",
    source: "a2c-personal-agent",
    target: "a2c-health",
    type: "animated",
  },
  {
    id: "a2c-e3",
    source: "a2c-personal-agent",
    target: "a2c-family",
    type: "animated",
  },
  {
    id: "a2c-e4",
    source: "a2c-personal-agent",
    target: "a2c-services",
    type: "animated",
  },
];

const GRAPH: Record<
  DemoScenario,
  {
    nodes: RFNode[];
    edges: RFEdge[];
  }
> = {
  a2a: { nodes: A2A_NODES, edges: A2A_EDGES },
  a2b: { nodes: A2B_NODES, edges: A2B_EDGES },
  a2c: { nodes: A2C_NODES, edges: A2C_EDGES },
};

function WorkflowFlowInner({ scenario }: { scenario: DemoScenario }) {
  const { nodes: seedNodes, edges: seedEdges } = GRAPH[scenario];
  const [nodes, , onNodesChange] = useNodesState(seedNodes);
  const [edges, , onEdgesChange] = useEdgesState(seedEdges);

  const chatHref =
    scenario === "a2a"
      ? "/agentes/a2a"
      : scenario === "a2b"
        ? "/agentes/a2b"
        : "/agentes/a2c";

  const chatLabel =
    scenario === "a2a"
      ? "ejemplo entre dos agentes"
      : scenario === "a2b"
        ? "ejemplo negocio y proveedor"
        : "ejemplo de reparto personal";

  return (
    <Canvas
      className="h-full min-h-0 w-full touch-none!"
      edges={edges}
      edgeTypes={EDGE_TYPES}
      fitViewOptions={{ padding: 0.2 }}
      nodes={nodes}
      nodeTypes={WORKFLOW_NODE_TYPES}
      nodesConnectable={false}
      nodesDraggable={false}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      proOptions={{ hideAttribution: true }}
    >
      <Controls className="border-[#272b36]" />
      <Panel
        position="top-left"
        className="m-3 border-[#272b36] bg-background/93 p-0 shadow-md backdrop-blur-sm"
      >
        <Link
          href={chatHref}
          className="inline-flex px-3 py-2 text-[13px] font-medium text-[#f4f6fa] underline-offset-4 hover:underline hover:decoration-[#f0b90b]/85"
        >
          Ir a {chatLabel}
        </Link>
      </Panel>
    </Canvas>
  );
}

export type PaymentWorkflowCanvasProps = {
  scenario: DemoScenario;
  className?: string;
};

export function PaymentWorkflowCanvas({ scenario, className }: PaymentWorkflowCanvasProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#272b36] bg-[#12151c] shadow-[0_22px_50px_-30px_rgba(0,0,0,0.85)] ring-1 ring-[#f0b90b]/[0.07]",
        className,
      )}
    >
      <div className="flex min-h-[320px] w-full flex-1 flex-col md:min-h-[360px]">
        <ReactFlowProvider>
          <WorkflowFlowInner scenario={scenario} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
