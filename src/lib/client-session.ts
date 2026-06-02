import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { normalizePhone } from "@/lib/phone";

const COOKIE_NAME = "jamila_client";

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-client-secret";
}

export function signClientPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  return jwt.sign({ phone: normalized }, getSecret(), { expiresIn: "30d" });
}

export function verifyClientToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getSecret()) as { phone?: string };
    return payload.phone ?? null;
  } catch {
    return null;
  }
}

export async function getClientPhoneFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyClientToken(token);
}

export { COOKIE_NAME };
