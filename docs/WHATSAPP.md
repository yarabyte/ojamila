# WhatsApp — envoi automatique

JAMILA supporte **trois fournisseurs**. Basculez avec `WHATSAPP_PROVIDER`.

```env
WHATSAPP_PROVIDER=wasender   # ou twilio, meta, auto
```

---

## Option A — WasenderAPI (recommandé)

API simple : texte, image (via URL publique), OTP.

### 1. Créer un compte

1. [wasenderapi.com](https://wasenderapi.com) → inscription
2. Connecter une session WhatsApp (QR code)
3. Copier l’**API Key** depuis le dashboard

### 2. Variables `.env` et Vercel

```env
WHATSAPP_PROVIDER=wasender
WASENDER_API_KEY="votre-clé-api"
```

### 3. Tester

- Staff → activer un abonnement → **Envoyer le QR (image)**
- Client → **Recevoir mon code** → OTP envoyé automatiquement
- Liste d’attente → promotion → message auto

### 4. QR image en local vs production

Wasender télécharge l’image depuis une **URL publique** (`NEXT_PUBLIC_APP_URL/api/public/qr/...`).

| Environnement | Comportement |
|---------------|--------------|
| **Local** (`http://localhost`) | Message **texte** avec lien QR (pas d’image) |
| **Production** (`https://ojamila.vercel.app`) | Image QR + légende |

### 5. Test curl

```bash
curl -X POST "https://www.wasenderapi.com/api/send-message" \
  -H "Authorization: Bearer VOTRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"+237695606060","text":"Test JAMILA"}'
```

Doc : [wasenderapi.com/api-docs](https://wasenderapi.com/api-docs)

---

## Option B — Twilio

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

Voir section Twilio ci-dessous pour le sandbox.

---

## Option C — Meta Cloud API direct

```env
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN="EAA..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_API_VERSION="v25.0"
```

---

## Comportement JAMILA

| Action | Wasender | Twilio | Meta | Aucun |
|--------|----------|--------|------|-------|
| QR image | imageUrl (prod) | MediaUrl | Upload API | wa.me |
| Code OTP | Texte auto | Texte auto | Template ou texte | wa.me |
| Liste d'attente | Texte auto | Texte auto | Texte | wa.me |

---

## Dépannage WasenderAPI

| Erreur | Solution |
|--------|----------|
| `WasenderAPI non configuré` | Ajouter `WASENDER_API_KEY` dans `.env` / Vercel |
| Image non reçue en local | Normal — utilisez `https://` en prod ou le lien texte |
| Session déconnectée | Reconnecter WhatsApp dans le dashboard Wasender |
| Numéro invalide | Format E.164 : `+237695606060` |

## Dépannage Twilio

| Erreur | Solution |
|--------|----------|
| `63007` — not in sandbox | Envoyer `join xxx` au numéro sandbox |
| Limite 5 msg/jour (essai) | Ajouter une carte sur Twilio |
| Image non reçue | Vérifier `NEXT_PUBLIC_APP_URL` (HTTPS public) |

## Dépannage Meta

| Erreur | Solution |
|--------|----------|
| Template creation denied | Passer sur Wasender ou Twilio |
| `Recipient not in allowed list` | Ajouter le numéro en mode dev |

## Sécurité

- Ne jamais commiter `WASENDER_API_KEY`, tokens Twilio ou Meta
- Régénérer les clés en cas de fuite
