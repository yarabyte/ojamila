import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { normalizePhone } from "@/lib/phone";
import { phoneSchema } from "@/lib/phone";
import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
});

export class StaffService {
  async listStaff() {
    return prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async createStaff(input: z.infer<typeof createStaffSchema>) {
    const data = createStaffSchema.parse(input);
    const phone = normalizePhone(data.phone);
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new AppError("Ce numéro existe déjà", "PHONE_EXISTS", 400);
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        name: data.name,
        phone,
        email: data.email || null,
        passwordHash,
        role: "STAFF",
        active: true,
      },
    });
  }

  async setStaffActive(id: string, active: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "STAFF") {
      throw new AppError("Compte staff introuvable", "NOT_FOUND", 404);
    }
    return prisma.user.update({ where: { id }, data: { active } });
  }
}

export const staffService = new StaffService();
