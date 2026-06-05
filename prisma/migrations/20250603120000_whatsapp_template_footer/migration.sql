UPDATE "AppSettings"
SET "whatsappMessageTemplate" = 'Bonjour {{name}} ! Votre abonnement JAMILA est prêt. Consultez votre QR ici : {{qrLink}} — Code secours : {{shortCode}}. Conservez-le bien, vous en aurez besoin pour valider vos repas.'
WHERE "id" = 'singleton';
