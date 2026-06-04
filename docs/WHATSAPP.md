# WhatsApp — envoi automatique

JAMILA supporte **deux fournisseurs**. Basculez avec `WHATSAPP_PROVIDER`.

```env
WHATSAPP_PROVIDER=twilio   # ou meta, ou auto (Twilio puis Meta)
```

---

## Option A — Twilio (recommandé)

Plus simple que Meta direct, surtout si la création de templates est bloquée.

### 1. Créer un compte

1. [console.twilio.com](https://console.twilio.com) → inscription
2. **Messaging → Try WhatsApp → Sandbox**
3. Noter :
   - **Account SID**
   - **Auth Token**
   - Numéro sandbox : `whatsapp:+14155238886`

### 2. Activer le sandbox (tests)

Depuis votre téléphone, envoyez à **+1 415 523 8886** :

```
join <mot-de-votre-sandbox>
```

(ex. `join shadow-mountain` — affiché dans la console Twilio)

### 3. Variables `.env` et Vercel

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

### 4. Tester

- Staff → activer un abonnement → **Envoyer le QR (image)**
- Client → **Recevoir mon code** → OTP envoyé automatiquement

### 5. Production (numéro Ô JAMILA)

1. Twilio Console → **WhatsApp Senders** → demander un numéro business
2. Meta valide le numéro via Twilio (Twilio gère les templates)
3. Remplacer `TWILIO_WHATSAPP_FROM` par `whatsapp:+237XXXXXXXXX`

### Tarifs indicatifs

~0,005–0,08 USD / conversation selon le pays. Vérifier [twilio.com/whatsapp/pricing](https://www.twilio.com/whatsapp/pricing).

---

## Option B — Meta Cloud API direct

Voir section Meta ci-dessous si vous préférez rester sur l’API Graph Facebook.

```env
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN="EAA..."
WHATSAPP_PHONE_NUMBER_ID="234568036414845"
WHATSAPP_API_VERSION="v25.0"
```

Test curl :

```bash
curl -X POST \
  "https://graph.facebook.com/v25.0/VOTRE_PHONE_ID/messages" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"237695606060","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'
```

---

## Comportement JAMILA

| Action | Twilio | Meta | Aucun |
|--------|--------|------|-------|
| QR image | MediaUrl signée | Upload API | wa.me / partage |
| Code OTP | Texte auto | Template ou texte | wa.me |
| Liste d'attente | Texte auto | Texte ou wa.me | wa.me |

---

## Dépannage Twilio

| Erreur | Solution |
|--------|----------|
| `63007` — not in sandbox | Envoyer `join xxx` au numéro sandbox |
| `63016` — outside 24h window | Utiliser un Content Template (`TWILIO_WHATSAPP_CONTENT_SID`) |
| Image non reçue | Vérifier `NEXT_PUBLIC_APP_URL` (URL publique pour le QR) |

## Dépannage Meta

| Erreur | Solution |
|--------|----------|
| Template creation denied | Vérifier l’entreprise Meta ou passer sur Twilio |
| `Recipient not in allowed list` | Ajouter le numéro en mode dev (API Setup → To) |

## Sécurité

- Ne jamais commiter tokens Twilio ou Meta
- Régénérer les tokens en cas de fuite
