"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  formulaService,
  formulaInputSchema,
  isTestPeriodOver,
  resetPilotData,
  staffService,
  createStaffSchema,
} from "@/lib/services";
import { getAppSettings } from "@/lib/settings";
import { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const settingsSchema = z.object({
  dailyMealLimitDefault: z.coerce.number().int().min(1),
  validityDaysDefault: z.coerce.number().int().min(1),
  whatsappMessageTemplate: z.string().min(10),
  cguText: z.string().min(50),
  cguVersion: z.string().min(1),
  fundraisingGoalFcfa: z.coerce.number().int().min(0),
});

function parseTestPeriodEndsAt(
  formData: FormData
): { ok: true; value: Date | null } | { ok: false; error: string } {
  const raw = formData.get("testPeriodEndsAt");
  if (raw === null || (typeof raw === "string" && !raw.trim())) {
    return { ok: true, value: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Date de fin de test invalide" };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Date de fin de test invalide" };
  }
  return { ok: true, value: date };
}

function formatSettingsError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORIZED") {
      return "Session expirée — reconnectez-vous.";
    }
    if (e.message === "FORBIDDEN") {
      return "Accès refusé.";
    }
    if (e.message.includes("Unknown argument `testPeriodEndsAt`")) {
      return "Schéma base de données obsolète — exécutez « npx prisma generate » puis redémarrez le serveur.";
    }
    return e.message;
  }
  return "Erreur paramètres";
}

export async function upsertFormula(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    const raw = Object.fromEntries(formData.entries());
    const daily = formData.get("dailyMealLimit");
    const input = {
      ...raw,
      dailyMealLimit: daily === "" || daily === null ? null : daily,
      active: formData.get("active") === "on",
    };
    const parsed = formulaInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }
    if (id) {
      await formulaService.update(id, parsed.data);
    } else {
      await formulaService.create(parsed.data);
    }
    revalidatePath("/admin/formulas");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Erreur formule" };
  }
}

export async function deactivateFormula(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    await formulaService.deactivate(id);
    revalidatePath("/admin/formulas");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Erreur" };
  }
}

export async function updateSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return updateSettings(formData);
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    const raw = Object.fromEntries(formData.entries());
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    const testPeriod = parseTestPeriodEndsAt(formData);
    if (!testPeriod.ok) {
      return { success: false, error: testPeriod.error };
    }

    await prisma.appSettings.update({
      where: { id: "singleton" },
      data: {
        ...parsed.data,
        testPeriodEndsAt: testPeriod.value,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/cgu");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("updateSettings", e);
    return { success: false, error: formatSettingsError(e) };
  }
}

export async function createStaffAccountAction(formData: FormData): Promise<void> {
  await createStaffAccount(formData);
}

export async function createStaffAccount(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    const raw = Object.fromEntries(formData.entries());
    const parsed = createStaffSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }
    await staffService.createStaff(parsed.data);
    revalidatePath("/admin/staff");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Erreur création staff" };
  }
}

export async function toggleStaffActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    await staffService.setStaffActive(id, active);
    revalidatePath("/admin/staff");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Erreur" };
  }
}

export async function resetTestDataAction(): Promise<
  ActionResult<{ subscriptions: number; consumptions: number; clients: number }>
> {
  try {
    await requireRole(["ADMIN"]);
    const stats = await resetPilotData();
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/subscriptions");
    revalidatePath("/staff");
    revalidatePath("/");
    return { success: true, data: stats };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Erreur lors de la réinitialisation" };
  }
}

export async function getSettingsForAdmin() {
  await requireRole(["ADMIN"]);
  return getAppSettings();
}
