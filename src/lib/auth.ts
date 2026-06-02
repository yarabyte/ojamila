import { type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  type NextAuthOptions,
  getServerSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

function parseCredentials(credentials: Record<string, string> | undefined) {
  const login = credentials?.login;
  const password = credentials?.password;
  if (typeof login !== "string" || login.length < 3) return null;
  if (typeof password !== "string" || password.length < 6) return null;
  return { login, password };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email ou téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = parseCredentials(
          credentials as Record<string, string> | undefined
        );
        if (!parsed) return null;

        const { login, password } = parsed;
        const normalizedLogin = login.includes("@")
          ? login.toLowerCase()
          : normalizePhone(login);

        const user = await prisma.user.findFirst({
          where: {
            active: true,
            OR: [
              { email: normalizedLogin },
              { phone: normalizedLogin },
            ],
            role: { in: ["ADMIN", "STAFF"] },
          },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requireRole(allowed: Role[]) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!allowed.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
