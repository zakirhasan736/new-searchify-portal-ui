import { redirect } from "next/navigation";

export const metadata = { title: "Results" };

/** V8 has no AI-visibility board skin — map to Results. */
export default function Page() {
  redirect("/app/outcomes");
}
