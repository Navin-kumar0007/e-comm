import { getAdminSettings } from "@/app/actions/admin-settings";
import SettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();
  return <SettingsForm initialSettings={settings} />;
}
