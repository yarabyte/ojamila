import { prisma } from "@/lib/db";

export async function getAppSettings() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    throw new Error(
      "AppSettings singleton missing. Run: npx prisma db seed"
    );
  }
  return settings;
}
