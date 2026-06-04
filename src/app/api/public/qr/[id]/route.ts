import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr-display";
import { verifyQrMediaSignature } from "@/lib/services/whatsapp/qr-media-url";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sig = new URL(req.url).searchParams.get("sig");
  if (!verifyQrMediaSignature(params.id, sig)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: params.id },
    select: { qrToken: true, status: true },
  });

  if (!sub?.qrToken || sub.status !== "ACTIVE") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const png = await generateQrPngBuffer(sub.qrToken);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
