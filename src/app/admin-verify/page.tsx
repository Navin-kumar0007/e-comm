import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStaffContext } from "@/lib/auth-guard";
import { VerifyForm } from "./verify-form";

export const dynamic = "force-dynamic";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const staff = await getStaffContext();
  if (!staff) redirect("/");
  if (staff.twoStepOk) redirect("/admin");
  return <VerifyForm email={staff.user.email} />;
}
