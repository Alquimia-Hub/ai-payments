import { redirect } from "next/navigation";

/** Sin índice de workflows en la UI; `/workflows` lleva al primer diagrama. */
export default function WorkflowsIndexPage() {
  redirect("/workflows/a2a");
}
