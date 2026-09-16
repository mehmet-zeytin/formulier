# Deployment WO-applicatie op Plesk

## Doel

De WO-applicatie wordt vanuit GitLab op de Plesk-server geplaatst.

De frontend en backend worden op de server gebouwd. De backend wordt gestart via de Node.js-functionaliteit van Plesk; PM2 is niet nodig.

---

## 1. Project op de server plaatsen

Koppel de GitLab-repository aan Plesk of clone de repository handmatig naar de server.

Controleer dat minimaal aanwezig zijn:

- `backend/`
- `frontend/`
- `database/setup.sql`
- `database/werkorder_db_schema_dump.sql`
- `docs/WO_Plesk_Deployment.md`
- `backend/.env.production.example`

Echte secrets en productiegegevens horen niet in GitLab.

---

## 2. Dependencies installeren en applicatie bouwen

Installeer de dependencies.

Backend:

```bash
cd backend
npm install
npm run build
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Beide builds moeten zonder fouten eindigen.

---

## 3. Node.js in Plesk instellen

Gebruik:

```text
Application Mode: Production
Application Root: backend
Application Startup File: dist/index.js
```

Gebruik bij voorkeur een ondersteunde Node.js LTS-versie.

PM2 wordt niet gebruikt. Plesk beheert het Node.js-proces.

---

## 4. Database instellen

Maak in Plesk een MySQL-database en databasegebruiker aan.

Gebruik het actuele databaseschema uit:

```text
database/setup.sql
```

of:

```text
database/werkorder_db_schema_dump.sql
```

Het schema bevat onder andere de MFA-velden:

```text
mfa_enabled
mfa_secret
```

De schema-dump bevat geen gebruikers- of werkordergegevens.

---

## 5. Production environment-variabelen

Stel in Plesk minimaal de volgende backend environment-variabelen in:

```env
NODE_ENV=production

FRONTEND_URL=https://WO-DOMAIN-HIER

DB_HOST=localhost
DB_PORT=3306
DB_USER=PLESK_DB_USER
DB_PASSWORD=PLESK_DB_PASSWORD
DB_NAME=PLESK_DB_NAME

JWT_SECRET=NIEUWE_PRODUCTIE_JWT_SECRET
MFA_ENCRYPTION_KEY=NIEUWE_PRODUCTIE_MFA_ENCRYPTION_KEY

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

### JWT_SECRET

Gebruik voor productie een nieuwe, lange en willekeurige `JWT_SECRET`.

Gebruik niet dezelfde secret als in development.

### MFA_ENCRYPTION_KEY

`MFA_ENCRYPTION_KEY` moet Base64 zijn van exact 32 willekeurige bytes.

Een nieuwe sleutel kan bijvoorbeeld worden gegenereerd met:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Bewaar deze sleutel veilig en zet hem nooit in GitLab.

De sleutel wordt gebruikt om de TOTP/MFA-secrets versleuteld in de database op te slaan.

Als een bestaande database met reeds ingestelde MFA-accounts naar een andere server wordt gemigreerd, moet dezelfde `MFA_ENCRYPTION_KEY` worden meegenomen.

Als deze sleutel verloren gaat, kunnen bestaande versleutelde MFA-secrets niet meer worden ontsleuteld en moeten de betreffende MFA-koppelingen worden gereset.

---

## 6. MFA

MFA is verplicht voor actieve gebruikers.

### Eerste login

Bij een gebruiker waarvoor MFA nog niet is ingesteld:

1. gebruiker voert e-mail en wachtwoord in;
2. de applicatie toont een QR-code;
3. de gebruiker scant deze met een authenticator-app;
4. de gebruiker voert de 6-cijferige code in;
5. na succesvolle verificatie wordt MFA geactiveerd.

### Volgende logins

Daarna verloopt login via:

```text
e-mail + wachtwoord
        ↓
6-cijferige authenticatorcode
        ↓
ingelogd
```

De QR-code wordt niet opnieuw getoond zolang MFA actief is.

### MFA-reset door gebruikersbeheer

Een owner kan MFA resetten voor admins en medewerkers.

Een admin kan MFA alleen resetten voor medewerkers.

MFA van het owner-account kan niet via het gebruikersbeheerscherm worden gereset.

Na een reset:

```text
mfa_enabled = FALSE
mfa_secret = NULL
token_version wordt verhoogd
```

De gebruiker moet bij de volgende login MFA opnieuw instellen.

Als het oude account nog in de Authenticator-app staat, moet dat oude account eerst uit de Authenticator-app worden verwijderd voordat de nieuwe QR-code wordt gescand.

---

## 7. Noodherstel owner-MFA

Als de owner geen toegang meer heeft tot de authenticator, kan MFA alleen door een beheerder met directe database-/servertoegang worden gereset.

Controleer eerst het owner-account:

```sql
SELECT
    id,
    email,
    role,
    is_deleted,
    mfa_enabled,
    token_version
FROM users
WHERE role = 'owner';
```

Voer daarna alleen bij daadwerkelijk verlies van MFA-toegang uit:

```sql
UPDATE users
SET
    mfa_enabled = FALSE,
    mfa_secret = NULL,
    token_version = token_version + 1
WHERE role = 'owner'
  AND is_deleted = FALSE;
```

Bij de volgende login moet de owner opnieuw een QR-code scannen.

Deze procedure verandert het wachtwoord niet.

Gebruik deze procedure alleen wanneer recovery daadwerkelijk noodzakelijk is.

---

## 8. Domein en HTTPS

Koppel het gewenste domein of subdomein aan de applicatie.

Activeer HTTPS via Plesk.

`FRONTEND_URL` moet exact overeenkomen met de uiteindelijke HTTPS-origin, bijvoorbeeld:

```env
FRONTEND_URL=https://werkorders.example.nl
```

Gebruik in productie geen localhost-URL.

---

## 9. Uploadmap

De map:

```text
backend/uploads
```

moet op de server schrijfbaar zijn voor de Node.js-applicatie.

De inhoud moet persistent blijven bij deployments.

De uploadmap wordt niet in Git opgeslagen.

---

## 10. Applicatie testen

Herstart na configuratiewijzigingen de Node.js-applicatie via Plesk.

Controleer minimaal:

- login met correct wachtwoord;
- verkeerd wachtwoord wordt geweigerd;
- eerste MFA-setup toont QR-code;
- correcte MFA-code werkt;
- verkeerde MFA-code wordt geweigerd;
- tweede login toont geen nieuwe QR-code;
- MFA-reset voor een testgebruiker;
- nieuwe MFA-setup na reset;
- owner/admin/medewerker-autorisatie;
- werkorders aanmaken;
- concept automatisch opslaan;
- werkorder openen en wijzigen;
- werkorder afronden;
- voltooide werkorder kan niet meer worden gewijzigd;
- foto-upload;
- private foto-weergave;
- logout.

---

## 11. Secrets

De volgende waarden mogen nooit naar GitLab:

```text
backend/.env
DB_PASSWORD
JWT_SECRET
MFA_ENCRYPTION_KEY
SMTP_PASSWORD
authenticator/TOTP secrets
QR-codes voor MFA
```

Gebruik voor productie nieuwe secrets.

Bewaar productie-secrets bij voorkeur in een wachtwoordmanager en in de environment-configuratie van Plesk.

---

## 12. Back-ups

Voor productie moet minimaal een back-up bestaan van:

- MySQL-database;
- `backend/uploads`.

Bewaar daarnaast een tweede/off-site kopie.

Bij een volledige restore van een database met bestaande MFA-accounts is ook de bijbehorende `MFA_ENCRYPTION_KEY` nodig.

---

## Belangrijk

- PM2 wordt op Plesk niet gebruikt.
- Plesk beheert het Node.js-proces.
- `backend/uploads` moet schrijfbaar en persistent zijn.
- Gebruik HTTPS.
- Gebruik nieuwe production secrets.
- Zet secrets nooit in GitLab.
- Bewaar `MFA_ENCRYPTION_KEY` veilig.
- Test MFA na deployment.