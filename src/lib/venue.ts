/** Identité et coordonnées Ô JAMILA (source unique) */

export const VENUE_NAME = "Ô JAMILA";
export const APP_NAME = "JAMILA";
export const APP_TAGLINE = "Abonnements repas";

export const VENUE_SERVICES = [
  "Cuisine du Monde",
  "Lounge & Bar",
  "Traiteur & Service à Domicile",
  "Plats à Emporter",
  "Livraison",
  "Location d'Espace",
] as const;

export const VENUE_ADDRESS = {
  city: "Douala — Bonapriso",
  street: "2965, Avenue De Gaulle",
  full: "Douala — Bonapriso, 2965, Avenue De Gaulle",
} as const;

export const VENUE_LEGAL = {
  rccm: "RD/DLA/2021/B/5972",
  niu: "M112116776242C",
} as const;

export const VENUE_PHONES = [
  { display: "6 97 47 04 65", tel: "+237697470465" },
  { display: "6 56 50 12 68", tel: "+237656501268" },
] as const;

export const VENUE_EMAIL = "ojamila2965@gmail.com";

export const VENUE_BUFFET_NOTE =
  "Buffet midi — formules abonnement · paiement espèces à la caisse";
