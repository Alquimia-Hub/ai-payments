import { redirect } from "next/navigation";

/** La app arranca en Wallet; no hay dashboard home. */
export default function HomePage() {
  redirect("/wallet");
}
