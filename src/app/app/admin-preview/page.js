import { redirect } from "next/navigation";

export const metadata = { title: "HQ" };

export default function Page() {
  redirect("/admin");
}
