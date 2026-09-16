# Formulier – Opleverformulier Werkorder

Nederlandstalige webapplicatie voor het aanmaken, automatisch opslaan, beheren, overdragen en afronden van werkorders.

---

# Inhoud

- Over het project
- Functionaliteiten
- Rollen en toegang
- Technologieën
- Architectuur
- Projectstructuur
- Vereisten
- Installatie vanaf GitLab
- Configuratie
- Eerste owner-account aanmaken
- Applicatie starten
- Production build lokaal draaien
- Authenticatie en beveiliging
- MFA
- Private foto's
- Werkorders en autorisatie
- Database
- Back-ups en herstel
- Builds controleren
- `.gitignore`
- Veelvoorkomende problemen
- Ontwikkelafspraken
- Deployment
- Productie
- Licentie

---

# Over het project

Formulier is een Nederlandstalige webapplicatie voor het invullen, opslaan, beheren, overdragen en afronden van werkorders.

De applicatie bestaat uit:

- React/Vite frontend
- Express/TypeScript backend
- MySQL 8.0 database

De backend bevat de autorisatie- en bedrijfslogica.

De frontend toont alleen gegevens en acties waarvoor de aangemelde gebruiker toegang heeft.

Voltooide werkorders zijn definitief en kunnen daarna niet meer worden aangepast.

---

# Functionaliteiten

## Werkorders

De applicatie ondersteunt onder andere:

- nieuwe werkorder als concept aanmaken;
- concept automatisch opslaan tijdens het invullen;
- concept later verder bewerken;
- werkorder aan een verantwoordelijke gebruiker toewijzen;
- extra toegang tot een werkorder verlenen;
- concept overdragen aan een andere gebruiker;
- reden van overdracht verplicht vastleggen;
- overdrachtshistorie bewaren;
- materialen registreren;
- materiaalcategorieën `klant`, `bedrijf` en `verkoop`;
- foto's uploaden;
- beschrijving en tijdstip bij foto's bewaren;
- werkorder definitief voltooien;
- voltooide werkorders beschermen tegen verdere wijzigingen;
- zoeken en filteren op toegankelijke werkorders.

## Gebruikersbeheer

Er zijn drie rollen:

```text
owner
admin
medewerker
```

Gebruikers worden soft-deleted.

Verwijderde accounts blijven voor auditdoeleinden in de database aanwezig, maar kunnen niet meer inloggen.

Bij wachtwoordwijzigingen, MFA-reset en verwijdering wordt de tokenversie aangepast, zodat bestaande sessies ongeldig kunnen worden gemaakt.

---

# Rollen en toegang

## Owner

De owner kan:

- alle werkorders en concepten bekijken;
- admins en medewerkers aanmaken;
- admins en medewerkers beheren;
- rollen wijzigen;
- wachtwoorden wijzigen;
- MFA resetten voor admins en medewerkers;
- extra werkordertoegang beheren.

Het owner-account zelf is beschermd tegen verwijderen en ongewenste rolwijzigingen.

MFA van het owner-account kan niet via het normale gebruikersbeheer worden gereset.

## Admin

Een admin kan:

- alle werkorders en concepten bekijken;
- medewerkers aanmaken en beheren;
- wachtwoorden van medewerkers wijzigen;
- MFA van medewerkers resetten.

Een admin kan geen owner beheren.

Een admin kan geen MFA van een owner of andere admin resetten.

## Medewerker

Een medewerker krijgt toegang tot een werkorder wanneer deze:

- als `assigned_to` aan de medewerker is toegewezen; of
- via extra werkordertoegang toegang heeft gekregen.

`created_by` is uitsluitend auditinformatie en bepaalt niet zelfstandig de actuele toegang.

Een medewerker met toegang tot een open concept kan het concept volgens de geldende autorisatieregels bewerken en overdragen.

---

# Technologieën

## Backend

- Node.js
- TypeScript
- Express 5
- MySQL2
- JSON Web Token
- bcrypt
- Multer
- Helmet
- express-rate-limit
- cookie-parser
- otplib
- qrcode
- Node.js `crypto`

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Database

- MySQL 8.0

## Oplevering

De applicatie wordt leeg opgeleverd.

De oplevering bevat:

- de volledige broncode;
- het actuele databaseschema;
- een schema-only database dump;
- deploymentdocumentatie.

De oplevering bevat geen:

- bestaande gebruikers;
- owner-account;
- werkorders;
- foto's of andere uploads;
- testdata;
- productiegegevens;
- secrets.

De map `backend/uploads` wordt niet met inhoud opgeleverd.

Het eerste owner-account wordt tijdens de productie-deployment aangemaakt nadat de database en environmentvariabelen zijn geconfigureerd.

## Procesbeheer productie

De productieomgeving gebruikt de Node.js-functionaliteit van Plesk.

PM2 wordt niet gebruikt voor de uiteindelijke Plesk-deployment.

---

# Architectuur

De backend gebruikt een gelaagde architectuur:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
MySQL
```

Controllers verwerken HTTP-verzoeken en responses.

Services bevatten bedrijfslogica en autorisatieregels.

Repositories verzorgen SQL-query's en databasecommunicatie.

Autorisatie wordt altijd in de backend afgedwongen.

Alleen knoppen verbergen in de frontend geldt niet als beveiliging.

---

# Projectstructuur

```text
werkorder-formulier/
├── backend/
│   ├── src/
│   ├── uploads/                    # lokaal, niet committen
│   ├── .env                        # lokaal, niet committen
│   ├── .env.example
│   └── .env.production.example
├── frontend/
│   ├── src/
│   ├── dist/                       # build-output, niet committen
│   ├── .env.development            # lokaal, niet committen
│   ├── .env.production
│   └── .env.example
├── database/
│   ├── setup.sql
│   └── werkorder_db_schema_dump.sql
├── docs/
│   └── WO_Plesk_Deployment.md
├── scripts/
│   ├── backup.ps1
│   ├── restore-photos.ps1
│   └── start-werkorder.bat
├── backups/                        # lokaal, niet committen
├── .gitignore
└── README.md
```

---

# Vereisten

Voor lokaal gebruik:

- Node.js 18 of hoger;
- npm;
- MySQL 8.0;
- moderne browser;
- Windows voor de huidige lokale service- en back-upscripts.

De huidige MySQL-installatie gebruikt de Windows-service:

```text
MySQL80
```

Controleer indien nodig:

```powershell
Get-Service *MySQL*
```

---

# Installatie vanaf GitLab

## 1. Repository klonen

```powershell
git clone <project-url>
cd werkorder-formulier
```

Vervang `<project-url>` door de GitLab-URL van het project.

## 2. Dependencies installeren

Backend:

```powershell
npm install --prefix backend
```

Frontend:

```powershell
npm install --prefix frontend
```

Als de root van het project eigen dependencies bevat:

```powershell
npm install
```

## 3. Database aanmaken

Log in als MySQL-root:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Voer in MySQL uit:

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

Gebruik nooit voorbeeldwachtwoorden in een echte omgeving.

## 4. Databaseschema laden

Importeer:

```text
database/setup.sql
```

in:

```text
werkorder_db
```

Bijvoorbeeld:

```powershell
Get-Content ".\database\setup.sql" |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
    -u formulier_user `
    -p `
    werkorder_db
```

Voer het databasewachtwoord in wanneer MySQL daarom vraagt.

---

# Configuratie

## Backend

Kopieer:

```text
backend/.env.example
```

naar:

```text
backend/.env
```

Voorbeeld:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=formulier_user
DB_PASSWORD="KIES_EEN_STERK_UNIEK_DATABASEWACHTWOORD"
DB_NAME=werkorder_db

JWT_SECRET=KIES_EEN_LANGE_WILLEKEURIGE_SECRET
MFA_ENCRYPTION_KEY=BASE64_VAN_32_WILLEKEURIGE_BYTES

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Belangrijk:

- `backend/.env` mag nooit naar GitLab;
- gebruik voor `DB_PASSWORD` hetzelfde wachtwoord als voor de MySQL-gebruiker;
- gebruik een sterke en willekeurige `JWT_SECRET`;
- `MFA_ENCRYPTION_KEY` moet Base64 zijn van exact 32 willekeurige bytes;
- echte secrets horen niet in broncode.

Een MFA encryption key kan worden gegenereerd met:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

De uitvoer hiervan mag niet naar GitLab worden gepusht.

## Frontend development

Voor lokale Vite-development:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Dit staat lokaal in:

```text
frontend/.env.development
```

## Frontend production

De productionconfiguratie gebruikt:

```env
VITE_API_BASE_URL=/api
```

Daardoor gebruikt de frontend in productie dezelfde origin als de backend.

---

# Eerste owner-account aanmaken

Na een volledig nieuwe database moet een eerste owner-account worden aangemaakt.

Ga naar:

```powershell
cd backend
```

Genereer een bcrypt-hash:

```powershell
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('KIES_EEN_STERK_WACHTWOORD',12).then(console.log)"
```

Gebruik daarna MySQL:

```sql
USE werkorder_db;

INSERT INTO users (
    email,
    password_hash,
    role
)
VALUES (
    'admin@formulier.nl',
    'PLAK_HIER_DE_BCRYPT_HASH',
    'owner'
);
```

Gebruik uitsluitend een unieke bcrypt-hash.

Plaats nooit een plaintext gebruikerswachtwoord in de database.

Bij de eerste login moet het owner-account MFA instellen.

---

# Applicatie starten

## Development

Backend:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

Normaal zijn dan beschikbaar:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
API:      http://localhost:3000/api
```

Tijdens development zijn de ingestelde localhost-origins toegestaan.

---

# Production build lokaal draaien

De backend kan de gebouwde frontend rechtstreeks serveren.

Frontend bouwen:

```powershell
cd frontend
npm run build
```

Backend bouwen:

```powershell
cd backend
npm run build
```

De backend start daarna vanuit:

```text
backend/dist/index.js
```

Voor een lokale productietest:

```powershell
cd backend
node dist/index.js
```

De applicatie is dan lokaal bereikbaar via:

```text
http://localhost:3000
```

Ook directe React Router-routes, zoals `/werkorders`, worden door de backend naar de frontend afgehandeld.

Voor de uiteindelijke productieomgeving wordt de Node.js-functionaliteit van Plesk gebruikt.

---

# Authenticatie en beveiliging

## Login

Login start via:

```text
POST /api/auth/login
```

De gebruiker voert eerst:

```text
e-mail
wachtwoord
```

in.

Na een correct wachtwoord wordt nog geen volledige gebruikerssessie aangemaakt.

De backend vraagt eerst MFA-verificatie.

Als MFA nog niet is ingesteld, wordt een tijdelijke MFA-challenge aangemaakt en wordt een QR-code getoond.

De gebruiker scant de QR-code met een authenticator-app.

Daarna voert de gebruiker de 6-cijferige code in.

De MFA-code wordt gecontroleerd via:

```text
POST /api/auth/mfa/verify
```

Pas na succesvolle MFA-verificatie wordt de normale authenticatiesessie aangemaakt.

De backend plaatst het JWT in een HttpOnly-cookie.

De frontend bewaart het JWT niet in `localStorage`.

De frontend stuurt geen handmatige:

```text
Authorization: Bearer <token>
```

header.

## Actuele gebruiker

```text
GET /api/auth/me
```

## Logout

```text
POST /api/auth/logout
```

De JWT is maximaal 8 uur geldig.

Wanneer `JWT_SECRET`, het wachtwoord of de relevante `token_version` verandert, worden bestaande sessies ongeldig.

---

# MFA

MFA is verplicht voor actieve gebruikers.

## Eerste login

Bij een gebruiker waarvoor MFA nog niet is ingesteld:

```text
e-mail + wachtwoord
        ↓
MFA-secret aanmaken
        ↓
QR-code tonen
        ↓
QR-code scannen
        ↓
6-cijferige code invoeren
        ↓
MFA activeren
        ↓
ingelogd
```

## Volgende logins

Bij volgende logins:

```text
e-mail + wachtwoord
        ↓
6-cijferige authenticatorcode
        ↓
ingelogd
```

De QR-code wordt niet opnieuw getoond zolang MFA actief is.

## MFA-secrets

MFA-secrets worden niet plaintext in de database opgeslagen.

De backend gebruikt AES-256-GCM om het MFA-secret te versleutelen.

Hiervoor is vereist:

```text
MFA_ENCRYPTION_KEY
```

De sleutel moet Base64 zijn van exact 32 willekeurige bytes.

Voor productie moet een nieuwe, aparte sleutel worden gebruikt.

De echte waarde mag nooit naar GitLab.

Als een bestaande database met actieve MFA-koppelingen naar een andere server wordt gemigreerd, moet dezelfde `MFA_ENCRYPTION_KEY` worden meegenomen.

Als deze sleutel verloren gaat, kunnen bestaande versleutelde MFA-secrets niet meer worden ontsleuteld.

De betreffende MFA-koppelingen moeten dan worden gereset.

## MFA-reset

Een owner kan MFA resetten voor:

```text
admin
medewerker
```

Een admin kan MFA alleen resetten voor:

```text
medewerker
```

Een medewerker kan geen MFA van andere gebruikers resetten.

MFA van het owner-account kan niet via het normale gebruikersbeheer worden gereset.

Bij een MFA-reset gebeurt:

```text
mfa_enabled = FALSE
mfa_secret = NULL
token_version = token_version + 1
```

Daardoor worden bestaande sessies van die gebruiker ongeldig.

Bij de volgende login krijgt de gebruiker opnieuw een QR-code en moet MFA opnieuw worden ingesteld.

Als het oude account nog in de Authenticator-app staat, moet dit oude account eerst uit de Authenticator-app worden verwijderd voordat de nieuwe QR-code wordt gescand.

---

# Owner MFA recovery

Als de owner geen toegang meer heeft tot de authenticator, moet recovery via directe database-/servertoegang plaatsvinden.

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

Voer alleen bij daadwerkelijk verlies van MFA-toegang uit:

```sql
UPDATE users
SET
    mfa_enabled = FALSE,
    mfa_secret = NULL,
    token_version = token_version + 1
WHERE role = 'owner'
  AND is_deleted = FALSE;
```

Deze procedure verandert het wachtwoord niet.

Bij de volgende login moet de owner MFA opnieuw instellen.

Gebruik deze recovery alleen wanneer dat daadwerkelijk nodig is.

---

# CSRF-bescherming

Voor state-changing requests controleert de backend de `Origin`.

Dit geldt voor:

```text
POST
PUT
PATCH
DELETE
```

Alleen toegestane frontend-origins mogen wijzigingen uitvoeren.

In development kunnen de ingestelde localhost-origins worden toegestaan.

In productie hoort uitsluitend de echte HTTPS-origin toegestaan te zijn.

---

# CORS

CORS is beperkt tot bekende frontend-origins.

Credentials zijn ingeschakeld voor cookie-authenticatie.

In productie wordt de toegestane frontend-origin bepaald met:

```text
FRONTEND_URL
```

---

# Rate limiting

Er is rate limiting voor:

- algemene `/api`-requests;
- loginpogingen;
- MFA-verificatiepogingen;
- foto-uploads.

De huidige limiter gebruikt een memory store.

Dit is geschikt voor de huidige single-instance opzet.

Bij meerdere backendinstances is een gedeelde externe store nodig.

---

# HTTP security headers

Helmet wordt gebruikt voor securityheaders.

De Content Security Policy staat voor afbeeldingen onder andere:

```text
blob:
```

toe.

Dit is nodig omdat private foto's als blob-URL in de frontend worden weergegeven.

---

# Foutafhandeling

De backend geeft gecontroleerde JSON-fouten terug voor onder andere:

- malformed JSON;
- te grote requests;
- API 404;
- interne serverfouten.

Interne technische details en secrets horen niet in foutresponses terecht te komen.

---

# Private foto's

Uploads worden niet publiek aangeboden via een algemene `/uploads`-route.

Een foto wordt via een beveiligd endpoint opgehaald:

```text
GET /api/werkorders/:werkorderId/fotos/:fotoId/file
```

De backend controleert:

- authenticatie;
- toegang tot de werkorder;
- of de foto daadwerkelijk bij die werkorder hoort;
- of het bestand veilig binnen de uploadmap valt.

Private foto's krijgen cacheheaders die browser- en proxycache zoveel mogelijk voorkomen.

---

# Uploadbeveiliging

Toegestane bestandstypen:

```text
JPEG
PNG
WEBP
```

Maximale bestandsgrootte:

```text
5 MB
```

Naast MIME-controle worden ook de daadwerkelijke bestandsbytes gecontroleerd.

Bestandsnamen worden willekeurig gegenereerd.

---

# Werkorders en autorisatie

## Concept

Een werkorder begint als concept:

```text
is_voltooid = 0
```

De frontend slaat wijzigingen automatisch op na een korte vertraging.

## Voltooid

Na definitief voltooien:

```text
is_voltooid = 1
```

Een voltooide werkorder is immutable.

Deze kan via normale werkorderroutes niet meer worden aangepast.

## Verantwoordelijkheid en toegang

```text
created_by
```

is de oorspronkelijke maker en auditinformatie.

```text
assigned_to
```

is de primaire verantwoordelijke.

Extra toegang wordt opgeslagen voor aanvullende gebruikers die toegang tot een werkorder hebben.

Owner en admin hebben globale toegang.

## Overdracht

Open concepten kunnen volgens de autorisatieregels worden overgedragen.

Bij overdracht:

- is een reden verplicht;
- wordt de historie bewaard;
- wordt de nieuwe verantwoordelijke opgeslagen;
- blijven historische gegevens beschikbaar voor auditdoeleinden.

---

# Database

De belangrijkste tabellen en gegevens omvatten onder andere:

## users

Belangrijke velden:

```text
id
email
password_hash
role
is_deleted
deleted_at
token_version
mfa_enabled
mfa_secret
created_at
```

`mfa_secret` bevat geen plaintext TOTP-secret.

Het MFA-secret wordt versleuteld opgeslagen.

## werkorders

Belangrijke gegevens:

```text
werkorder-ID
datum
starttijd
eindtijd
uitgevoerde werkzaamheden
status
is_voltooid
created_by
assigned_to
created_at
updated_at
```

## materialen

Categorieën:

```text
klant
bedrijf
verkoop
```

## fotos

Metadata van private foto's bevat onder andere:

```text
werkorder
bestandspad
beschrijving
genomen_op
created_at
```

Daarnaast ondersteunt de database:

- extra werkordertoegang;
- overdrachtshistorie;
- immutable auditinformatie;
- MFA-status en versleutelde MFA-secrets.

Het actuele schema staat in:

```text
database/setup.sql
```

De schema-only dump staat in:

```text
database/werkorder_db_schema_dump.sql
```

De schema-dump bevat geen echte gebruikers-, werkorder- of MFA-data.

---

# Back-ups en herstel

## Automatische lokale back-up

Script:

```text
scripts/backup.ps1
```

De back-up bevat:

- MySQL-dump;
- ZIP van uploads.

De MySQL-dump gebruikt onder andere:

```text
--no-tablespaces
--single-transaction
--default-character-set=utf8mb4
```

De databasegegevens voor de back-up worden lokaal via MySQL login-path beheerd.

De huidige lokale login-path heet:

```text
werkorder_backup
```

Handmatig testen:

```powershell
.\scripts\backup.ps1
```

Back-ups ouder dan 14 dagen worden alleen verwijderd wanneer ze overeenkomen met de bekende back-uppatronen.

## Fotoherstel

Script:

```text
scripts/restore-photos.ps1
```

Dit script kan een gekozen foto uit een back-up veilig naar een tijdelijke herstelmap uitpakken.

## Belangrijk

De huidige back-up staat nog lokaal op dezelfde machine.

Voor definitieve productie is daarnaast een tweede/off-site back-uplocatie vereist, bijvoorbeeld:

```text
OneDrive
NAS
aparte server
object storage
```

Bij een volledige restore van een database met bestaande MFA-accounts is ook de bijbehorende:

```text
MFA_ENCRYPTION_KEY
```

nodig.

---

# Builds controleren

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
cd backend
npm run build
```

Beide builds moeten zonder fouten eindigen voordat wijzigingen naar productie gaan.

---

# `.gitignore`

Onder andere de volgende gegevens horen niet in Git:

```text
node_modules/
dist/
backend/.env
frontend/.env
frontend/.env.development
frontend/dist/
backend/dist/
backups/
database-backups/
backend/uploads/
temp_restore/
restore_selected_photo/
```

De volgende bestanden horen wel in de repository zolang daarin geen secrets of productiegegevens staan:

```text
database/setup.sql
database/werkorder_db_schema_dump.sql
docs/WO_Plesk_Deployment.md
backend/.env.example
backend/.env.production.example
frontend/.env.example
frontend/.env.production
```

---

# Veelvoorkomende problemen

## Access denied for user 'formulier_user'@'localhost'

Controleer of:

- het MySQL-wachtwoord van `formulier_user` klopt;
- `DB_PASSWORD` in `backend/.env` exact overeenkomt;
- de gebruiker rechten op `werkorder_db` heeft.

## Login geeft "Verzoek geblokkeerd vanwege ongeldige herkomst"

Controleer:

```text
FRONTEND_URL
```

en de toegestane development-origins in de backend.

Voor lokale Vite-development:

```text
http://localhost:5173
```

Voor een lokale production build:

```text
http://localhost:3000
```

## Login geeft 401 Unauthorized

Controleer:

- databaseverbinding;
- gebruikersaccount;
- wachtwoord;
- of de gebruiker niet soft-deleted is.

Als het wachtwoord correct is en MFA actief is, moet daarna de MFA-verificatie plaatsvinden.

## MFA-code is onjuist

Controleer:

- of de juiste gebruiker in de authenticator-app wordt gebruikt;
- of het apparaat de juiste datum en tijd gebruikt;
- of de code nog geldig is;
- of MFA recent is gereset.

Als MFA is gereset, is de oude authenticator-koppeling niet meer geldig.

Verwijder in dat geval het oude account uit de authenticator-app en scan de nieuwe QR-code.

## MFA_ENCRYPTION_KEY ontbreekt

Controleer of de backend environment deze waarde bevat:

```text
MFA_ENCRYPTION_KEY
```

De waarde moet Base64 zijn van exact 32 bytes.

## Frontend kan backend niet bereiken

Development:

```text
Frontend: http://localhost:5173
API:      http://localhost:3000/api
```

Production build:

```text
Frontend + API: http://localhost:3000
API-prefix:     /api
```

---

# Ontwikkelafspraken

- zichtbare applicatieteksten zijn Nederlandstalig;
- controllers bevatten zo min mogelijk bedrijfslogica;
- bedrijfslogica hoort in services;
- SQL-query's horen in repositories;
- gevoelige waarden horen niet in broncode;
- `.env`-bestanden met echte secrets mogen niet naar GitLab;
- voltooide werkorders zijn niet meer bewerkbaar;
- autorisatie wordt altijd door de backend afgedwongen;
- `created_by` blijft auditinformatie en wordt niet gebruikt als vervanging voor de actuele toegangstoewijzing;
- MFA-secrets mogen nooit worden gelogd;
- MFA QR-codes mogen niet worden opgeslagen of gedeeld;
- production secrets moeten verschillen van development secrets.

---

# Deployment

Voor deployment op Plesk:

```text
Plesk deployment-handleiding:
docs/WO_Plesk_Deployment.md

Database schema dump:
database/werkorder_db_schema_dump.sql

Backend broncode:
backend/

Frontend broncode:
frontend/

Production environment voorbeeld:
backend/.env.production.example
```

Echte secrets en productiegegevens worden niet in GitLab opgeslagen.

---

# Productie

De applicatie is technisch voorbereid voor deployment op Plesk.

De productieflow is:

```text
GitLab
        ↓
Frontend en backend build
        ↓
Express / Node.js
        ↓
Plesk Node.js
        ↓
HTTPS-domein
```

Plesk beheert het Node.js-proces.

PM2 is niet nodig.

## Production environment

Minimaal nodig:

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

Gebruik voor productie nieuwe secrets.

Gebruik niet dezelfde `JWT_SECRET` of `MFA_ENCRYPTION_KEY` als in development.

---

# Nog te doen voor definitieve productie

De volgende punten worden afgerond zodra de echte productieomgeving bekend is:

- echt domein configureren;
- HTTPS activeren;
- `NODE_ENV=production` instellen;
- `FRONTEND_URL` naar de echte HTTPS-origin wijzigen;
- nieuwe production `JWT_SECRET` genereren;
- nieuwe production `MFA_ENCRYPTION_KEY` genereren;
- production databasegegevens configureren;
- CORS/CSRF beperken tot de echte productie-origin;
- `backend/uploads` schrijfbaar en persistent maken;
- tweede/off-site back-uplocatie configureren;
- Plesk Node.js definitief configureren;
- production smoke test uitvoeren.

## Definitieve smoke test

Controleer minimaal:

```text
login
eerste MFA-setup
MFA-verificatie
verkeerde MFA-code
tweede login zonder nieuwe QR-code
MFA-reset testgebruiker
nieuwe MFA-setup na reset
logout
owner/admin/medewerker-rechten
werkorder aanmaken
werkorder bewerken
autosave
foto uploaden
foto openen
overdracht
voltooide werkorder onveranderbaar
back-up
```

---

# Security-check productie

Controleer vóór livegang minimaal:

```text
HTTPS actief
NODE_ENV=production
FRONTEND_URL correct
nieuwe JWT_SECRET
nieuwe MFA_ENCRYPTION_KEY
geen .env in Git
geen echte secrets in Git
geen gebruikersdata in schema-dump
MFA actief
MFA reset getest
owner recovery gedocumenteerd
uploads persistent
off-site back-up beschikbaar
frontend build succesvol
backend build succesvol
npm audit gecontroleerd
```

---

# Licentie

Er is momenteel geen afzonderlijke opensourcelicentie opgegeven.

Zonder expliciete licentie mag de broncode niet zonder toestemming worden gekopieerd, aangepast of verspreid.