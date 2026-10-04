import { getAdminSettings } from "@/app/actions/admin-settings";
import { listProviders } from "@/lib/shipping";
import SettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();
  return <SettingsForm initialSettings={settings} providers={listProviders()} />;
}
