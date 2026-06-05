-- Update default thank-you message template for existing installations
UPDATE "AppSettings"
SET "thankYouMessageTemplate" = 'Merci {{name}} pour votre confiance et votre participation à la soirée des partenaires du 4 juin 2026.

Vous avez souscrit à la formule {{formulaName}}. Grâce à vous, nous allons continuer à vous offrir des moments exceptionnels chez Ô JAMILA.

Retrouvez les photos de l''événement ici : {{driveLink}}'
WHERE id = 'singleton';
