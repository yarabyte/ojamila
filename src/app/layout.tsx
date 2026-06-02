import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AuthSessionProviderRoot } from "@/components/providers/session-provider-root";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "JAMILA — Abonnements Ô JAMILA",
  description:
    "Prévente d'abonnements repas buffet — Ô JAMILA, Bonapriso, Douala. Avenue De Gaulle 2965.",
  manifest: "/manifest.json",
  applicationName: "Ô JAMILA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ô JAMILA",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${fraunces.variable} antialiased`}>
        <AuthSessionProviderRoot>
          {children}
          <PwaRegister />
          <PwaInstallPrompt />
        </AuthSessionProviderRoot>
      </body>
    </html>
  );
}
