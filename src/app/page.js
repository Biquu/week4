import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const store = await cookies();
  const sid = store.get("dd_sid")?.value;
  redirect(sid ? "/dashboard" : "/login");
}
