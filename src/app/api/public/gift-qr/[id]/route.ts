import { MealGiftStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr-display";
import { verifyGiftQrMediaSignature } from "@/lib/services/whatsapp/qr-media-url";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sig = new URL(req.url).searchParams.get("sig");
  if (!verifyGiftQrMediaSignature(params.id, sig)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const gift = await prisma.mealGift.findUnique({
    where: { id: params.id },
    select: { giftToken: true, status: true },
  });

  if (!gift?.giftToken || gift.status !== MealGiftStatus.PENDING) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const png = await generateQrPngBuffer(gift.giftToken);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
