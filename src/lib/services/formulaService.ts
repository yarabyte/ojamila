import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { z } from "zod";

export const formulaInputSchema = z.object({
  name: z.string().min(1).max(80),
  mealsIncluded: z.coerce.number().int().min(1),
  bonusMeals: z.coerce.number().int().min(0),
  priceFcfa: z.coerce.number().int().min(0),
  salesTarget: z.coerce.number().int().min(0),
  hardCap: z.coerce.number().int().min(1),
  dailyMealLimit: z.coerce.number().int().min(1).optional().nullable(),
  validityDays: z.coerce.number().int().min(1).default(180),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type FormulaInput = z.infer<typeof formulaInputSchema>;

export class FormulaService {
  async listAll() {
    return prisma.formula.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async getById(id: string) {
    const formula = await prisma.formula.findUnique({ where: { id } });
    if (!formula) {
      throw new AppError("Formule introuvable", ErrorCodes.FORMULA_NOT_FOUND, 404);
    }
    return formula;
  }

  async create(input: FormulaInput) {
    const data = formulaInputSchema.parse(input);
    return prisma.formula.create({ data });
  }

  async update(id: string, input: Partial<FormulaInput>) {
    await this.getById(id);
    const data = formulaInputSchema.partial().parse(input);
    return prisma.formula.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    return this.update(id, { active: false });
  }
}

export const formulaService = new FormulaService();
