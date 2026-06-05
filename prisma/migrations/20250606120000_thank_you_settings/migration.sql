-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "thankYouMessageTemplate" TEXT NOT NULL DEFAULT 'Merci {{name}} pour votre confiance et votre participation à JAMILA !
Retrouvez les photos de l''événement ici : {{driveLink}}';
ALTER TABLE "AppSettings" ADD COLUMN "thankYouDriveUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "thankYouLastSentAt" TIMESTAMP(3);
ALTER TABLE "AppSettings" ADD COLUMN "thankYouLastSentCount" INTEGER;
