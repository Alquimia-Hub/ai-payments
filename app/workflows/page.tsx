import { redirect } from "next/navigation";

/** Sin índice de workflows en la UI; `/workflows` lleva al primer diagrama (orden alineado con Agentes: A2C → A2B → A2A). */
export default function WorkflowsIndexPage() {
  redirect("/workflows/a2c");
}
