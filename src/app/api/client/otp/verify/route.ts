import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { COOKIE_NAME, signClientPhone } from "@/lib/client-session";
import { getClientQrRedirectPath } from "@/lib/client-subscription";
import { AppError } from "@/lib/errors";
import { otpService } from "@/lib/services";

const schema = z.object({
  phone: z.string().min(8),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const phone = await otpService.verifyLoginOtp(
      parsed.data.phone,
      parsed.data.code
    );

    const token = signClientPhone(phone);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    const redirectTo = await getClientQrRedirectPath(phone);
    return NextResponse.json({ success: true, redirectTo });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.statusCode }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
