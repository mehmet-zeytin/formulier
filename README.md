# Formulier – Opleverformulier Werkorder

Nederlandstalige webapplicatie voor het aanmaken, automatisch opslaan, beheren, overdragen, afronden en archiveren van werkorders.

**Staging:** `https://staging.wo.samenict.nl`

De applicatie bestaat uit een React/TypeScript/Vite-frontend, een Node.js/Express 5/TypeScript-backend en een MySQL/MariaDB-database. Autorisatie, validatie en bedrijfsregels worden in de backend afgedwongen.

---

## Inhoud

- [Over het project](#over-het-project)
- [Functionaliteiten](#functionaliteiten)
- [Rollen en rechten](#rollen-en-rechten)
- [Werkorderworkflow](#werkorderworkflow)
- [Overdrachtsverzoeken](#overdrachtsverzoeken)
- [Authenticatie en MFA](#authenticatie-en-mfa)
- [E-mailnotificaties](#e-mailnotificaties)
- [Foto's](#fotos)
- [Prullenbak en datumregels](#prullenbak-en-datumregels)
- [Technische stack](#technische-stack)
- [Architectuur](#architectuur)
- [Projectstructuur](#projectstructuur)
- [Database](#database)
- [Lokale installatie](#lokale-installatie)
- [Eerste owner-account](#eerste-owner-account)
- [Environmentvariabelen](#environmentvariabelen)
- [Development en builds](#development-en-builds)
- [Staging op Plesk](#staging-op-plesk)
- [Teamtest op staging](#teamtest-op-staging)
- [Beveiliging](#beveiliging)
- [Back-up en herstel](#back-up-en-herstel)
- [Git en secrets](#git-en-secrets)
- [Veelvoorkomende problemen](#veelvoorkomende-problemen)
- [Opleverchecklist](#opleverchecklist)
- [Huidige status](#huidige-status)
- [Licentie](#licentie)

---

## Over het project

Formulier is een interne werkorderapplicatie voor het registreren en beheren van werkzaamheden.

Belangrijke ontwerpkeuzes:

- werkorders beginnen als concept;
- concepten worden automatisch opgeslagen;
- voltooide werkorders zijn immutable/read-only;
- toegang wordt backend-side gecontroleerd;
- `created_by` blijft auditinformatie;
- `assigned_to` bepaalt de primaire verantwoordelijke;
- extra toegang wordt via `werkorder_access` opgeslagen;
- overdrachten verlopen via een acceptatie-/weigerflow;
- foto's zijn niet publiek toegankelijk;
- gebruikers en werkorders gebruiken waar nodig soft-delete;
- MFA werkt per gebruiker met een eigen TOTP-secret.

---

## Functionaliteiten

### Werkorders

- Concept-WO aanmaken
- Autosave tijdens het invullen
- Concept later verder bewerken
- Primaire verantwoordelijke via `assigned_to`
- Extra toegang via `werkorder_access`
- Overdrachtsverzoek naar admin/medewerker
- Verplichte overdrachtsreden
- Accepteren of weigeren door ontvanger
- Verplichte afwijsreden bij weigeren
- Assignment history / audittrail
- Materialen registreren
- Materiaalcategorieën `klant`, `bedrijf` en `verkoop`
- Private foto's uploaden
- Beschrijving en tijdstip bij foto's opslaan
- Werkorder definitief voltooien
- Voltooide werkorder read-only maken
- Zoeken en filteren
- Soft-delete
- Owner-only prullenbak
- Herstellen en definitief verwijderen
- Rolafhankelijke datumbeperkingen

### Gebruikersbeheer

Rollen:

- `owner`
- `admin`
- `medewerker`

Ondersteund:

- gebruikers aanmaken;
- rollen beheren binnen de hiërarchie;
- wachtwoorden wijzigen;
- MFA resetten;
- gebruikers soft-deleten en herstellen;
- sessies ongeldig maken via `token_version`.

---

## Rollen en rechten

### Owner

Kan alle werkorders/concepten bekijken, admins en medewerkers beheren, rollen/wachtwoorden/MFA beheren, extra werkordertoegang beheren en de prullenbak gebruiken. Het owner-account is beschermd tegen ongewenste verwijdering en rolwijziging.

### Admin

Kan alle werkorders/concepten bekijken en medewerkers beheren. Een admin kan geen owner beheren en heeft geen owner-only prullenbakrechten.

### Medewerker

Heeft toegang wanneer de medewerker als `assigned_to` is ingesteld of via `werkorder_access` extra toegang heeft. `created_by` is auditinformatie en bepaalt niet automatisch de actuele toegang.

---

## Werkorderworkflow

Een nieuwe werkorder start als:

```text
is_voltooid = 0
```

Na definitief afronden:

```text
is_voltooid = 1
```

Een voltooide werkorder kan via de normale werkorderroutes niet meer worden aangepast.

Belangrijk:

```text
created_by       = oorspronkelijke maker / audit
assigned_to      = actuele primaire verantwoordelijke
werkorder_access = aanvullende toegang
```

---

## Overdrachtsverzoeken

Een concept-WO wordt niet direct overgedragen.

1. Verzender kiest een geldige admin/medewerker.
2. Overdrachtsreden is verplicht.
3. Backend maakt een request met status `pending`.
4. `assigned_to` blijft nog ongewijzigd.
5. Ontvanger ziet **Overdrachtsverzoeken** op `/werkorders`.
6. Ontvanger kiest **Accepteren** of **Weigeren**.
7. Bij weigeren is een afwijsreden verplicht.
8. Bij accepteren wordt `assigned_to` gewijzigd.
9. De wijziging wordt in de assignment history opgeslagen.
10. Bij weigeren blijft de huidige verantwoordelijke ongewijzigd.

Frontend:

```text
frontend/src/components/TransferNotifications.tsx
frontend/src/services/werkorderService.ts
```

Backend:

```text
backend/src/controllers/WerkorderController.ts
backend/src/services/WerkorderService.ts
backend/src/repositories/WerkorderRepository.ts
backend/src/routes/werkorderRoutes.ts
```

API-routes:

```text
GET  /api/werkorders/transfer-requests
POST /api/werkorders/transfer-requests/:requestId/accept
POST /api/werkorders/transfer-requests/:requestId/reject
```

Bij accepteren controleert de backend opnieuw of het request nog `pending` is, de ingelogde gebruiker de bedoelde ontvanger is, de werkorder niet voltooid/verwijderd is en de actuele `assigned_to` nog overeenkomt met de verwachte oorspronkelijke situatie.

---

## Authenticatie en MFA

Belangrijke routes:

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

De normale sessie gebruikt een JWT in een **HttpOnly-cookie**. De frontend bewaart de normale JWT niet in `localStorage`.

De backend controleert bij beveiligde requests onder andere:

- JWT-handtekening en expiry;
- `is_deleted`;
- actuele rol;
- `token_version`.

### MFA

MFA gebruikt TOTP-codes van 6 cijfers. Bij setup genereert de backend een secret, slaat die versleuteld op, toont een QR-code en verifieert daarna een geldige code.

MFA-secrets worden beschermd met AES-256-GCM via:

```text
MFA_ENCRYPTION_KEY
```

### MFA reset

Na reset wordt de bestaande MFA-configuratie uitgeschakeld en krijgt de gebruiker bij nieuwe setup een nieuwe QR-code. Oude sessies kunnen via `token_version` ongeldig worden gemaakt.

Als een testaccount al met de Authenticator van de ontwikkelaar is gekoppeld, reset MFA vóór de teamtest en laat de tester de nieuwe QR-code zelf scannen.

Deel nooit Authenticator QR-codes of TOTP-secrets via README, Git, chat of screenshots.

---

## E-mailnotificaties

Bij een nieuw overdrachtsverzoek ontvangt de ontvanger naast de in-app-notificatie ook een e-mail.

Systeemafzender:

```text
Samen ICT Werkorders <noreply@samenict.nl>
```

De e-mail bevat onder andere:

- werkordernummer;
- huidige verantwoordelijke;
- gebruiker die het verzoek heeft gestart;
- overdrachtsreden;
- instructie om in te loggen en het verzoek te accepteren of te weigeren.

Gebruikersinput wordt HTML-escaped voordat deze in HTML-e-mails wordt geplaatst.

De verzendende applicatiegebruiker hoeft geen echte mailbox te hebben. Bijvoorbeeld `wim@formulier.nl` kan een WO overdragen naar een gebruiker met een echt e-mailadres. De echte systeemmail wordt via `noreply@samenict.nl` verstuurd.

### Staging SMTP

```env
SMTP_HOST=192.168.254.203
SMTP_PORT=26
SMTP_SECURE=false
SMTP_IGNORE_TLS=true
SMTP_FROM=noreply@samenict.nl
```

Voor deze relay worden geen `SMTP_USER` en `SMTP_PASSWORD` gebruikt.

De relay gebruikt geen authenticatie en geen TLS, draait op poort 26 en is zowel rechtstreeks vanaf Plesk als via de echte overdrachtsflow succesvol getest.

---

## Foto's

Foto's worden niet als publieke static map aangeboden.

Beveiligd endpoint, bijvoorbeeld:

```text
GET /api/werkorders/:werkorderId/fotos/:fotoId/file
```

Ondersteund:

```text
JPEG
PNG
WEBP
```

Maximum:

```text
5 MB
```

Beveiliging:

- authenticatie en werkordertoegang;
- foto/werkorder-relatiecontrole;
- veilig bestandspad;
- MIME-validatie;
- magic-bytecontrole;
- willekeurige bestandsnamen;
- geen algemene publieke `/uploads`-route.

---

## Prullenbak en datumregels

### Prullenbak

Normale verwijdering gebruikt soft-delete. De prullenbak is **owner-only**. De owner kan verwijderde werkorders bekijken, herstellen en definitief verwijderen.

### Datumregels

Backend-side:

- `medewerker`: maximaal 30 dagen terug;
- `admin`: maximaal 90 dagen terug;
- `owner`: maximaal 90 dagen terug;
- toekomstige datums zijn niet toegestaan.

---

## Technische stack

### Frontend

React, TypeScript, Vite, Tailwind CSS, React Router, Axios.

### Backend

Node.js, TypeScript, Express 5, MySQL2, JWT, bcrypt, Multer, Helmet, express-rate-limit, cookie-parser, Nodemailer, otplib, qrcode.

### Database

- lokaal: MySQL 8
- staging: MariaDB via Plesk

### Runtime

Lokaal kan een production-like build via Node/PM2 worden gedraaid. Staging draait via Plesk Node.js/Passenger.

---

## Architectuur

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

- **Controller:** HTTP-request/response
- **Service:** bedrijfsregels, autorisatie, validatie en workflows
- **Repository:** SQL, transacties en databasecommunicatie

Autorisatie wordt altijd in de backend afgedwongen.

---

## Projectstructuur

```text
werkorder-formulier/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── uploads/                # runtime/lokaal, niet committen
│   ├── dist/                   # build-output, niet committen
│   ├── .env                    # lokaal, niet committen
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── dist/                   # build-output, niet committen
│   ├── .env.development        # lokaal, niet committen
│   ├── .env.production
│   └── package.json
├── database/
│   ├── setup.sql
│   └── werkorder_db_schema_dump.sql
├── docs/
│   └── WO_Plesk_Deployment.md
├── scripts/
│   ├── backup.ps1
│   ├── restore-photos.ps1
│   └── start-werkorder.bat
├── backups/                    # niet committen
├── .gitignore
└── README.md
```

Tijdelijke debug- of SMTP-testscripts horen niet in de definitieve repository.

---

## Database

Het basisschema staat in:

```text
database/setup.sql
```

Voor een nieuwe installatie moet dit bestand een lege database volledig kunnen opbouwen zonder handmatige aanvullende schemawijzigingen.

Belangrijke structuren:

- `users`
- `werkorders`
- `materialen`
- `fotos`
- `werkorder_access`
- assignment/transfer history
- `werkorder_transfer_requests`

### `werkorder_transfer_requests`

De transferrequesttabel is toegevoegd aan het actuele `database/setup.sql`.

```sql
CREATE TABLE werkorder_transfer_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    from_user_id INT NULL,
    to_user_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
    rejection_reason VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_transfer_request_werkorder
        FOREIGN KEY (werkorder_id)
        REFERENCES werkorders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_request_from_user
        FOREIGN KEY (from_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transfer_request_to_user
        FOREIGN KEY (to_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_request_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

Betekenis:

- `werkorder_id`: betreffende WO;
- `from_user_id`: huidige/oorspronkelijke verantwoordelijke;
- `to_user_id`: bedoelde ontvanger;
- `requested_by`: gebruiker die het verzoek heeft gestart;
- `reason`: verplichte overdrachtsreden;
- `status`: `pending`, `accepted` of `rejected`;
- `rejection_reason`: reden bij weigering;
- `created_at`: moment van aanvraag;
- `responded_at`: moment van antwoord.

---

## Lokale installatie

### Vereisten

- Node.js 18 of hoger
- npm
- MySQL 8
- moderne browser
- Windows voor de huidige PowerShell-back-up/herstelscripts

Controle MySQL-service:

```powershell
Get-Service *MySQL*
```

### Repository en dependencies

```powershell
git clone <repository-url>
cd werkorder-formulier
npm install --prefix backend
npm install --prefix frontend
```

### Database

```sql
CREATE DATABASE IF NOT EXISTS werkorder_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'formulier_user'@'localhost'
IDENTIFIED BY 'KIES_EEN_STERK_UNIEK_WACHTWOORD';

GRANT ALL PRIVILEGES
ON werkorder_db.*
TO 'formulier_user'@'localhost';

FLUSH PRIVILEGES;
```

Importeer daarna:

```text
database/setup.sql
```

---

## Eerste owner-account

Een lege opleverdatabase bevat geen vooraf aangemaakte productiegebruiker.

Genereer vanuit `backend/` een bcrypt-hash:

```powershell
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('KIES_EEN_STERK_WACHTWOORD',12).then(console.log)"
```

Voeg de eerste owner daarna toe volgens het actuele `users`-schema. Gebruik nooit een plaintext wachtwoord in de database en zet geen productieaccount of productiecredential in `setup.sql`.

---

## Environmentvariabelen

Echte secrets horen nooit in Git.

### Backend development

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=formulier_user
DB_PASSWORD=<STERK_DATABASE_WACHTWOORD>
DB_NAME=werkorder_db

JWT_SECRET=<LANGE_WILLEKEURIGE_SECRET>
MFA_ENCRYPTION_KEY=<GELDIGE_ENCRYPTIESLEUTEL>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_IGNORE_TLS=false
SMTP_USER=<SMTP_GEBRUIKER>
SMTP_PASSWORD=<SMTP_WACHTWOORD_OF_APP_PASSWORD>
SMTP_FROM=<AFZENDER>
```

### Frontend development

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Frontend staging/production

```env
VITE_API_BASE_URL=/api
```

### Plesk runtime

Belangrijk:

```text
NODE_ENV
FRONTEND_URL
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
MFA_ENCRYPTION_KEY
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_IGNORE_TLS
SMTP_FROM
```

---

## Development en builds

Backend development:

```powershell
cd backend
npm run dev
```

Frontend development:

```powershell
cd frontend
npm run dev
```

Standaard:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
API:      http://localhost:3000/api
```

Backend build:

```powershell
cd backend
npm run build
```

Startup-output:

```text
backend/dist/index.js
```

Frontend build:

```powershell
cd frontend
npm run build
```

Op Plesk bestaat daarnaast het backend-package-script:

```text
build:frontend
```

Beide builds moeten zonder fouten afronden vóór deployment.

---

## Staging op Plesk

```text
URL:              https://staging.wo.samenict.nl
Node.js:          20.20.2
Application Root: /httpdocs/backend
Startup file:     dist/index.js
Environment:      production
```

Deploymentflow:

1. **Git → Deploy now**
2. **Node.js → Run script → build**
3. **Node.js → Run script → build:frontend**
4. **Restart App**
5. staging smoke-testen

Bij frontendwijzigingen controleren dat de nieuwe bundle daadwerkelijk wordt geserveerd.

---

## Teamtest op staging

Voor overdrachtstests kan bijvoorbeeld worden ingelogd met:

```text
wim@formulier.nl
```

Deze applicatiegebruiker hoeft geen echte mailbox te hebben.

Testflow:

1. log in met `wim@formulier.nl`;
2. open/maak een concept-WO;
3. kies een admin/medewerker met een echt e-mailadres;
4. vul een overdrachtsreden in;
5. verstuur het verzoek;
6. controleer dat de WO nog niet direct wordt overgedragen;
7. controleer dat de ontvanger e-mail krijgt van `Samen ICT Werkorders <noreply@samenict.nl>`;
8. log in als ontvanger;
9. controleer **Overdrachtsverzoeken**;
10. test **Accepteren** en controleer dat de WO bij de ontvanger verschijnt;
11. maak een nieuw request;
12. test **Weigeren**;
13. controleer dat een afwijsreden verplicht is;
14. controleer dat de WO bij weigeren niet wordt overgedragen.

Als MFA van een testaccount al aan een andere Authenticator is gekoppeld, reset MFA en laat de tester de nieuwe QR-code zelf scannen.

---

## Beveiliging

Onder andere:

- bcrypt password hashing
- JWT in HttpOnly-cookie
- `token_version`
- TOTP-MFA
- AES-256-GCM voor MFA-secrets
- rate limiting
- Helmet
- CORS-beperkingen
- CSRF `Origin`-controle voor state-changing requests
- backendautorisatie
- private foto-endpoints
- MIME- en magic-bytevalidatie
- immutable voltooide werkorders
- soft-delete
- HTML escaping in e-mails

Nooit publiceren:

```text
DB_PASSWORD
JWT_SECRET
MFA_ENCRYPTION_KEY
SMTP_PASSWORD
Authenticator QR-codes
TOTP-secrets
```

Bij rotatie van `MFA_ENCRYPTION_KEY` moeten betrokken gebruikers MFA opnieuw instellen.

---

## Back-up en herstel

Belangrijke scripts:

```text
scripts/backup.ps1
scripts/restore-photos.ps1
```

Back-up bevat onder andere:

- MySQL-dump
- ZIP van uploads

MySQL-dump gebruikt onder andere:

```text
--no-tablespaces
--single-transaction
--default-character-set=utf8mb4
```

Huidige lokale MySQL login-path:

```text
werkorder_backup
```

Handmatig testen:

```powershell
.\scripts\backup.ps1
```

Back-ups ouder dan 14 dagen worden alleen verwijderd wanneer ze overeenkomen met de bekende back-uppatronen.

Een back-up is pas betrouwbaar wanneer herstel periodiek is getest. Voor productie is daarnaast een onafhankelijke/off-site back-uplocatie aanbevolen.

---

## Git en secrets

Niet committen:

```text
backend/.env
frontend/.env
frontend/.env.development
node_modules/
backend/dist/
frontend/dist/
backend/uploads/
backups/
database-backups/
temp_restore/
restore_selected_photo/
tijdelijke SMTP-testscripts
tijdelijke debugbestanden
```

Wel committen indien secretvrij:

```text
database/setup.sql
database/werkorder_db_schema_dump.sql
backend/.env.example
backend/.env.production.example
frontend/.env.example
frontend/.env.production
README.md
docs/WO_Plesk_Deployment.md
```

---

## Veelvoorkomende problemen

### `Access denied for user 'formulier_user'@'localhost'`

Controleer DB-wachtwoord, `DB_PASSWORD`, databasehost en rechten.

### `401 Unauthorized`

Controleer account, wachtwoord, soft-delete, databaseverbinding en sessie/cookie.

### Ongeldige herkomst

Controleer `FRONTEND_URL` en toegestane origins.

### Transfer request staat in DB maar UI toont niets

Controleer als ontvanger:

```text
GET /api/werkorders/transfer-requests
```

Als de API het request teruggeeft maar de UI niet, controleer `TransferNotifications.tsx`, frontendbuild, deployment, app restart en browsercache.

### Transfer request blijft `pending`

Dit is normaal totdat de bedoelde ontvanger accepteert of weigert. De WO wordt bij het aanmaken van het request nog niet overgedragen.

### Geen transfer-e-mail

Controleer:

```text
SMTP_HOST=192.168.254.203
SMTP_PORT=26
SMTP_SECURE=false
SMTP_IGNORE_TLS=true
SMTP_FROM=noreply@samenict.nl
```

### MFA-code alleen beschikbaar bij ontwikkelaar

Reset MFA voor het account en laat de uiteindelijke tester de nieuwe QR-code zelf scannen.

---

## Opleverchecklist

### Functionaliteit

- [ ] Login/logout
- [ ] MFA setup/login/reset
- [ ] Owner/admin/medewerkerrechten
- [ ] Concept + autosave
- [ ] Datumbeperkingen
- [ ] Materialen
- [ ] Foto upload/openen
- [ ] Extra werkordertoegang
- [ ] Transfer request
- [ ] Transfer-notificatie
- [ ] Transfer-e-mail
- [ ] Accepteren
- [ ] Weigeren + verplichte reden
- [ ] Voltooide WO read-only
- [ ] Soft-delete/prullenbak/herstellen
- [ ] Definitief verwijderen

### Techniek

- [ ] Backend build zonder fouten
- [ ] Frontend build zonder fouten
- [x] `werkorder_transfer_requests` in `database/setup.sql`
- [ ] Volledige `database/setup.sql` op een lege database getest
- [ ] Plesk environment gecontroleerd
- [ ] Tijdelijke SMTP/debugscripts verwijderd
- [ ] Back-up getest
- [ ] Herstel getest

### Oplevering/security

- [ ] Geen secrets in Git of README
- [ ] Geen Authenticator QR-codes/TOTP-secrets in documentatie
- [ ] Blootgestelde credentials waar nodig geroteerd
- [ ] Testgebruikers opgeschoond of bewust behouden
- [ ] Test-WO's/testfoto's opgeschoond
- [ ] Openstaande test-transfers opgeschoond
- [ ] Geen vooraf ingevulde productieaccounts in opleverpakket

---

## Huidige status

Per **30 september 2026** is op staging gecontroleerd dat:

- transfer requests als `pending` worden opgeslagen;
- de WO niet direct wordt overgedragen;
- de ontvanger de notificatie ziet;
- **Accepteren** werkt;
- na accepteren de WO bij de ontvanger verschijnt;
- **Weigeren** met verplichte reden wordt ondersteund;
- transfer-e-mail bij een echt ontvangeradres aankomt;
- systeemmail via `Samen ICT Werkorders <noreply@samenict.nl>` wordt verstuurd;
- de interne SMTP-relay vanaf Plesk bereikbaar is;
- de relay zonder authenticatie en zonder TLS op poort 26 werkt;
- `werkorder_transfer_requests` in `database/setup.sql` staat.

Volgende stap: functionele acceptatietest door het team en daarna opschoning voor definitieve oplevering.

---

## Licentie

Er is momenteel geen afzonderlijke opensourcelicentie opgegeven. Zonder expliciete licentie mag de broncode niet zonder toestemming worden gekopieerd, aangepast of verspreid.
