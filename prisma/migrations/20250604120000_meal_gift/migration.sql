-- CreateEnum
CREATE TYPE "MealGiftStatus" AS ENUM ('PENDING', 'CONSUMED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "whatsappGiftTemplate" TEXT NOT NULL DEFAULT 'Bonjour ! {{senderName}} vous offre un repas chez Ô JAMILA. Présentez ce QR à la caisse — usage unique. Code secours : {{shortCode}}.';

-- CreateTable
CREATE TABLE "MealGift" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "giftToken" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "status" "MealGiftStatus" NOT NULL DEFAULT 'PENDING',
    "consumptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealGift_giftToken_key" ON "MealGift"("giftToken");

-- CreateIndex
CREATE UNIQUE INDEX "MealGift_shortCode_key" ON "MealGift"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "MealGift_consumptionId_key" ON "MealGift"("consumptionId");

-- CreateIndex
CREATE INDEX "MealGift_subscriptionId_status_idx" ON "MealGift"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "MealGift_recipientPhone_idx" ON "MealGift"("recipientPhone");

-- AddForeignKey
ALTER TABLE "MealGift" ADD CONSTRAINT "MealGift_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealGift" ADD CONSTRAINT "MealGift_consumptionId_fkey" FOREIGN KEY ("consumptionId") REFERENCES "Consumption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
