"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, ROLE_PERMISSIONS, STAFF_ROLES, type StaffRole } from "@/lib/permissions";
import { setStaffRoleAction } from "@/app/actions/admin-staff";

const select = "h-9 px-2 rounded-lg border border-input bg-background text-sm";

export function StaffClient({ staff, myId }: { staff: Array<{ id: string; name: string; email: string; role: StaffRole }>; myId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("PACKER");

  const change = (target: string, nextRole: string, ok: string) =>
    start(async () => {
      const res = await setStaffRoleAction(target, nextRole);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(ok);
      router.refresh();
    });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Staff</h1>
        <p className="text-muted-foreground mt-1">Give team members access to only what they need. Changes apply immediately.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          change(email, role, `${email} added as ${ROLE_LABELS[role].name}`);
          setEmail("");
        }}
        className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-wrap items-end gap-3"
      >
        <label className="flex-1 min-w-[220px] space-y-1">
          <span className="text-xs text-muted-foreground">Email of their store account</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" className={`${select} w-full`} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={select}>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].name}</option>)}
          </select>
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />} Add
        </Button>
        <p className="w-full text-xs text-muted-foreground">They must sign up on the store first. After being added, they should sign out and back in to see the Admin link.</p>
      </form>

      <div className="rounded-2xl bg-card border border-border/50 shadow-sm divide-y divide-border/50">
        {staff.map((s) => (
          <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{s.name}{s.id === myId && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={s.role}
                disabled={pending || s.id === myId}
                onChange={(e) => change(s.email, e.target.value, `${s.name} is now ${ROLE_LABELS[e.target.value as StaffRole].name}`)}
                className={select}
              >
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].name}</option>)}
              </select>
              {s.id !== myId && (
                <Button size="sm" variant="ghost" className="text-red-600" disabled={pending} onClick={() => change(s.email, "USER", `${s.name}'s staff access removed`)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {STAFF_ROLES.map((r) => (
          <div key={r} className="p-4 rounded-2xl bg-card border border-border/50 text-sm">
            <p className="font-semibold">{ROLE_LABELS[r].name}</p>
            <p className="text-muted-foreground text-xs mt-1">{ROLE_LABELS[r].description}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{ROLE_PERMISSIONS[r].length} permissions</p>
          </div>
        ))}
      </div>
    </div>
  );
}
