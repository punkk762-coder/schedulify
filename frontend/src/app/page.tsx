import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!session.userId || !session.role) {
    redirect("/login");
  }

  if (session.role === "MOM") {
    redirect("/mom");
  }

  redirect("/today");
}
