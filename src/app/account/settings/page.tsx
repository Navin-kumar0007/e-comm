import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { PrivacyCard } from "./privacy-card";
import { getMyPrivacy } from "@/app/actions/privacy";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { dietaryTags: true }
  });

  const [availableTags, privacy] = await Promise.all([
    prisma.dietaryTag.findMany({ orderBy: { name: 'asc' } }),
    getMyPrivacy(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[30px] font-heading font-bold leading-none text-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      <SettingsForm user={user} availableTags={availableTags} />
      <PrivacyCard initial={privacy} />
    </div>
  );
}
