import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 280,
  margin: 2,
  color: { dark: "#231F20", light: "#FBFAED" },
} as const;

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, QR_OPTIONS);
}

export async function generateQrPngBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { ...QR_OPTIONS, type: "png" });
}

export function getSubscriptionQrUrl(subscriptionId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/client/subscription/${subscriptionId}`;
}
