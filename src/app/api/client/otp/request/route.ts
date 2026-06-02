import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { otpService } from "@/lib/services";

const schema = z.object({ phone: z.string().min(8) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
    }

    const result = await otpService.requestLoginOtp(parsed.data.phone);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.statusCode }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
