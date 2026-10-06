import { requirePagePermission } from "@/lib/auth-guard";
import { getStaff } from "@/app/actions/admin-staff";
import { StaffClient } from "./staff-client";

export default async function AdminStaffPage() {
  const me = await requirePagePermission("staff.manage");
  const staff = await getStaff();
  return <StaffClient staff={JSON.parse(JSON.stringify(staff))} myId={me.user.id} />;
}
