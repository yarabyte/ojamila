import { SettingsForm } from "@/components/admin/settings-form";
import { isTestPeriodOver } from "@/lib/services";
import { getAppSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();
  const showReset = isTestPeriodOver(settings.testPeriodEndsAt);

  return (
    <div className="space-y-6 pb-16">
      <h1 className="font-display text-2xl font-semibold">Paramètres globaux</h1>
      <SettingsForm settings={settings} showReset={showReset} />
    </div>
  );
}
