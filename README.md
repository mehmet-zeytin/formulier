Formulier – Opleverformulier Werkorder

Nederlandstalige webapplicatie voor het aanmaken, automatisch opslaan, beheren, overdragen en afronden van werkorders.

Inhoud

Over het project

Functionaliteiten

Rollen en toegang

Technologieën

Architectuur

Projectstructuur

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

Vereisten

Installatie vanaf GitLab

Configuratie

Applicatie starten

Production build lokaal draaien

De backend kan de gebouwde frontend rechtstreeks serveren.

Frontend bouwen

cd frontend

npm run build

Backend bouwen

cd backend

npm run build

De backend start daarna vanuit:

backend/dist/index.js

Voor een lokale productietest:

cd backend

node dist/index.js

De applicatie is dan lokaal bereikbaar via:

http://localhost:3000

Ook directe React Router-routes, zoals /werkorders, worden door de backend naar de frontend afgehandeld.

Voor de uiteindelijke productieomgeving wordt de Node.js-functionaliteit van Plesk gebruikt.

Authenticatie en beveiliging

Private foto's

Werkorders en autorisatie

Database

Back-ups en herstel

Builds controleren

Veelvoorkomende problemen

Deployment

Voor deployment op Plesk:

Plesk deployment-handleiding: docs/WO_Plesk_Deployment.md

Database schema dump: database/werkorder_db_schema_dump.sql

Backend broncode: backend/

Frontend broncode: frontend/

Production environment voorbeeld: backend/.env.production.example

Echte secrets en productiegegevens worden niet in GitLab opgeslagen.

Productie

De applicatie is technisch voorbereid voor deployment op Plesk.

De productieflow is:

GitLab
↓
Frontend en backend build
↓
Express / Node.js
↓
Plesk Node.js
↓
HTTPS-domein

Plesk beheert het Node.js-proces.

Nog te doen voor definitieve productie

Over het project

Formulier is een Nederlandstalige webapplicatie voor het invullen, opslaan, beheren, overdragen en afronden van werkorders.

De applicatie bestaat uit:

React/Vite frontend

Express/TypeScript backend

MySQL 8.0 database

De backend bevat de autorisatie- en bedrijfslogica. De frontend toont alleen gegevens en acties waarvoor de aangemelde gebruiker toegang heeft.

Voltooide werkorders zijn definitief en kunnen daarna niet meer worden aangepast.

Functionaliteiten

Werkorders

Nieuwe werkorder als concept aanmaken

Concept automatisch opslaan tijdens het invullen

Concept later verder bewerken

Werkorder aan een verantwoordelijke gebruiker toewijzen

Extra toegang tot een werkorder verlenen

Concept overdragen aan een andere gebruiker

Reden van overdracht verplicht vastleggen

Overdrachtshistorie bewaren

Materialen registreren

Materiaalcategorieën klant, bedrijf en verkoop

Foto's uploaden

Beschrijving en tijdstip bij foto's bewaren

Werkorder definitief voltooien

Voltooide werkorders beschermen tegen verdere wijzigingen

Zoeken en filteren op toegankelijke werkorders

Gebruikersbeheer

Er zijn drie rollen:

owner

admin

medewerker

Gebruikers worden soft-deleted. Verwijderde accounts blijven voor auditdoeleinden in de database aanwezig, maar kunnen niet meer inloggen.

Bij wachtwoordwijzigingen en verwijdering wordt de tokenversie aangepast, zodat bestaande sessies ongeldig worden.

Rollen en toegang

Owner

De owner kan:

alle werkorders en concepten bekijken

admins en medewerkers aanmaken

admins en medewerkers beheren

rollen wijzigen

wachtwoorden wijzigen

extra werkordertoegang beheren

Het owner-account zelf is beschermd tegen verwijderen en ongewenste rolwijzigingen.

Admin

Een admin kan:

alle werkorders en concepten bekijken

medewerkers aanmaken en beheren

wachtwoorden van medewerkers wijzigen

Een admin kan geen owner beheren en heeft geen volledige ownerrechten voor rolbeheer.

Medewerker

Een medewerker krijgt toegang tot een werkorder wanneer deze:

als assigned_to aan de medewerker is toegewezen; of

via extra werkordertoegang toegang heeft gekregen.

created_by is uitsluitend auditinformatie en bepaalt niet zelfstandig de actuele toegang.

Een medewerker met toegang tot een open concept kan het concept volgens de geldende autorisatieregels bewerken en overdragen.

Technologieën

Backend

Node.js

TypeScript

Express 5

MySQL2

JSON Web Token

bcrypt

Multer

Helmet

express-rate-limit

cookie-parser

Frontend

React

TypeScript

Vite

Tailwind CSS

React Router

Axios

Database

MySQL 8.0

Architectuur

De backend gebruikt een gelaagde architectuur:

Controller → Service → Repository

Controllers verwerken HTTP-verzoeken en responses.

Services bevatten bedrijfslogica en autorisatieregels.

Repositories verzorgen SQL-query's en databasecommunicatie.

Autorisatie wordt altijd in de backend afgedwongen. Alleen knoppen verbergen in de frontend geldt niet als beveiliging.

Projectstructuur

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

Vereisten

Voor lokaal gebruik:

Node.js 18 of hoger

npm

MySQL 8.0

moderne browser

Windows voor de huidige lokale service- en back-upscripts

De huidige MySQL-installatie gebruikt de Windows-service:

MySQL80

Controleer indien nodig:

Get-Service *MySQL*

Installatie vanaf GitLab

1. Repository klonen

git clone <project-url>

cd werkorder-formulier

Vervang <project-url> door de GitLab-URL van het project.

2. Dependencies installeren

npm install --prefix backend

npm install --prefix frontend

Als de root van het project eigen dependencies bevat:

npm install

3. Database aanmaken

Log in als MySQL-root:

& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

Voer in MySQL uit:

CREATE DATABASE IF NOT EXISTS werkorder_db

  CHARACTER SET utf8mb4

  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'formulier_user'@'localhost'

IDENTIFIED BY 'KIES_EEN_STERK_UNIEK_WACHTWOORD';

GRANT ALL PRIVILEGES

ON werkorder_db.*

TO 'formulier_user'@'localhost';

FLUSH PRIVILEGES;

Gebruik nooit voorbeeldwachtwoorden in een echte omgeving.

4. Databaseschema laden

Importeer database/setup.sql in werkorder_db met de MySQL-client of MySQL Workbench.

Configuratie

Backend

Kopieer:

backend/.env.example

naar:

backend/.env

Voorbeeld:

NODE_ENV=development

PORT=3000

FRONTEND_URL=http://localhost:3000

DB_HOST=localhost

DB_PORT=3306

DB_USER=formulier_user

DB_PASSWORD="KIES_EEN_STERK_UNIEK_DATABASEWACHTWOORD"

DB_NAME=werkorder_db

JWT_SECRET=KIES_EEN_LANGE_WILLEKEURIGE_SECRET

SMTP_HOST=

SMTP_PORT=587

SMTP_SECURE=false

SMTP_USER=

SMTP_PASSWORD=

SMTP_FROM=

Belangrijk:

backend/.env mag nooit naar GitLab.

Gebruik voor DB_PASSWORD exact hetzelfde wachtwoord als voor formulier_user in MySQL.

Aanhalingstekens rond DB_PASSWORD zijn verstandig wanneer het wachtwoord speciale tekens bevat.

JWT_SECRET hoort alleen bij de backend en wordt niet in MySQL opgeslagen.

Secrets horen in een wachtwoordmanager en in de lokale/runtime .env, niet in broncode.

Frontend development

Voor lokale Vite-development:

VITE_API_BASE_URL=http://localhost:3000/api

Dit staat lokaal in:

frontend/.env.development

Frontend production

De productionconfiguratie gebruikt:

VITE_API_BASE_URL=/api

Daardoor gebruikt de frontend in productie dezelfde origin als de backend.

Eerste owner-account aanmaken

Na een volledig nieuwe database moet een eerste owner-account worden aangemaakt.

Genereer vanuit backend/ een bcrypt-hash:

node -e "const bcrypt=require('bcrypt'); bcrypt.hash('KIES_EEN_STERK_WACHTWOORD',12).then(console.log)"

Voeg daarna de gebruiker toe volgens het actuele schema in database/setup.sql.

Gebruik uitsluitend een unieke bcrypt-hash en plaats nooit een plaintext gebruikerswachtwoord in de database.

Applicatie starten

Development

Backend:

cd backend

npm run dev

Frontend:

cd frontend

npm run dev

Normaal zijn dan beschikbaar:

Frontend: http://localhost:5173

Backend:  http://localhost:3000

Tijdens development zijn localhost-origins voor de gebruikte Vite-poorten toegestaan.

Production build lokaal draaien

De backend kan de gebouwde frontend rechtstreeks serveren.

Frontend bouwen

cd frontend

npm run build

Backend bouwen

cd backend

npm run build

De backend start daarna vanuit:

backend/dist/index.js

Voor een lokale productietest:

cd backend

node dist/index.js

De applicatie is dan lokaal bereikbaar via:

http://localhost:3000

Ook directe React Router-routes, zoals /werkorders, worden door de backend naar de frontend afgehandeld.

Voor de uiteindelijke productieomgeving wordt de Node.js-functionaliteit van Plesk gebruikt.

Authenticatie en beveiliging

Authenticatie

Login:

POST /api/auth/login

Na succesvolle login plaatst de backend het JWT in een HttpOnly-cookie.

De frontend bewaart het JWT niet in localStorage en stuurt geen handmatige Authorization: Bearer ... header meer.

Actuele gebruiker:

GET /api/auth/me

Logout:

POST /api/auth/logout

De JWT is maximaal 8 uur geldig.

Wanneer JWT_SECRET, het wachtwoord of de relevante tokenversie verandert, worden bestaande sessies ongeldig.

CSRF-bescherming

Voor state-changing requests (POST, PUT, PATCH, DELETE) controleert de backend de Origin.

Alleen toegestane frontend-origins mogen wijzigingen uitvoeren.

In development kunnen de ingestelde localhost-origins worden toegestaan. In productie hoort uitsluitend de echte HTTPS-origin toegestaan te zijn.

CORS

CORS is beperkt tot bekende frontend-origins en credentials zijn ingeschakeld voor cookie-authenticatie.

Rate limiting

Er is rate limiting voor:

algemene /api-requests

loginpogingen

foto-uploads

De huidige limiter gebruikt een memory store en is geschikt voor de huidige single-instance opzet. Bij meerdere backendinstances is een gedeelde externe store nodig.

HTTP security headers

Helmet wordt gebruikt voor securityheaders.

De Content Security Policy staat voor afbeeldingen onder andere blob: toe, omdat private foto's als blob-URL in de frontend worden weergegeven.

Foutafhandeling

De backend geeft gecontroleerde JSON-fouten terug voor onder andere malformed JSON, te grote requests, API 404 en interne serverfouten.

Private foto's

Uploads worden niet publiek aangeboden via een algemene /uploads-route.

Een foto wordt via een beveiligd endpoint opgehaald:

GET /api/werkorders/:werkorderId/fotos/:fotoId/file

De backend controleert:

authenticatie

toegang tot de werkorder

of de foto daadwerkelijk bij die werkorder hoort

of het bestand veilig binnen de uploadmap valt

Private foto's krijgen cacheheaders die browser- en proxycache zoveel mogelijk voorkomen.

Uploadbeveiliging

Toegestaan:

JPEG

PNG

WEBP

Maximale bestandsgrootte:

5 MB

Naast MIME-controle worden ook de daadwerkelijke bestandsbytes gecontroleerd.

Bestandsnamen worden willekeurig gegenereerd.

Werkorders en autorisatie

Concept

Een werkorder begint als concept:

is_voltooid = 0

De frontend slaat wijzigingen automatisch op na een korte vertraging.

Voltooid

Na definitief voltooien:

is_voltooid = 1

Een voltooide werkorder is immutable en kan via normale werkorderroutes niet meer worden aangepast.

Verantwoordelijkheid en toegang

created_by = oorspronkelijke maker / auditinformatie

assigned_to = primaire verantwoordelijke

extra toegang = aanvullende gebruikers die toegang tot het werkorder hebben

Owner en admin hebben globale toegang.

Overdracht

Open concepten kunnen volgens de autorisatieregels worden overgedragen.

Bij overdracht:

is een reden verplicht

wordt de historie bewaard

wordt de nieuwe verantwoordelijke opgeslagen

blijven historische gegevens bruikbaar voor auditdoeleinden

Database

De belangrijkste gegevens omvatten:

users

Onder andere:

id

email

password_hash

role

is_deleted

deleted_at

token_version

created_at

werkorders

Onder andere:

werkorder-ID

datum en tijden

uitgevoerde werkzaamheden

status

is_voltooid

created_by

assigned_to

created_at

updated_at

materialen

Categorieën:

klant

bedrijf

verkoop

fotos

Metadata van private foto's, waaronder werkorder, bestandspad, beschrijving, genomen_op en created_at.

Daarnaast ondersteunt de database extra werkordertoegang en overdrachtshistorie volgens het actuele schema in database/setup.sql.

Back-ups en herstel

Automatische lokale back-up

Script:

scripts/backup.ps1

De back-up bevat:

MySQL-dump

ZIP van uploads

De MySQL-dump gebruikt onder andere:

--no-tablespaces

--single-transaction

--default-character-set=utf8mb4

De databasegegevens voor de back-up worden lokaal via MySQL login-path beheerd.

De huidige lokale login-path heet:

werkorder_backup

Handmatig testen:

.\scripts\backup.ps1

Back-ups ouder dan 14 dagen worden alleen verwijderd wanneer ze overeenkomen met de bekende back-uppatronen.

Fotoherstel

Script:

scripts/restore-photos.ps1

Dit script kan een gekozen foto uit een back-up veilig naar een tijdelijke herstelmap uitpakken.

Belangrijk

De huidige back-up staat nog lokaal op dezelfde machine.

Voor definitieve productie is daarnaast een tweede/off-site back-uplocatie vereist, bijvoorbeeld OneDrive, NAS, aparte server of object storage.

Builds controleren

Frontend:

cd frontend

npm run build

Backend:

cd backend

npm run build

Beide builds moeten zonder fouten eindigen voordat wijzigingen naar productie gaan.

.gitignore

Onder andere de volgende gegevens horen niet in Git:

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

database/setup.sql, database/werkorder_db_schema_dump.sql, docs/WO_Plesk_Deployment.md, .env.example-bestanden, backend/.env.production.example en frontend/.env.production horen wel in de repository zolang daarin geen secrets of productiegegevens staan.

Veelvoorkomende problemen

Access denied for user 'formulier_user'@'localhost'

Controleer of:

het MySQL-wachtwoord van formulier_user klopt

DB_PASSWORD in backend/.env exact overeenkomt

de gebruiker rechten op werkorder_db heeft

Login geeft Verzoek geblokkeerd vanwege ongeldige herkomst

Controleer FRONTEND_URL en de toegestane development-origins in de backend.

Voor lokaal gebruik via de door de backend gebouwde frontend:

http://localhost:3000

Voor Vite-development:

http://localhost:5173

Login geeft 401 Unauthorized

Controleer databaseverbinding, gebruikersaccount, wachtwoord en of de gebruiker niet soft-deleted is.

Na een wachtwoord- of JWT-secretwijziging moet opnieuw worden ingelogd.

Frontend kan backend niet bereiken

Development:

Frontend: http://localhost:5173

API:      http://localhost:3000/api

Production build:

Frontend + API: http://localhost:3000

API-prefix:     /api

Ontwikkelafspraken

Zichtbare applicatieteksten zijn Nederlandstalig.

Controllers bevatten zo min mogelijk bedrijfslogica.

Bedrijfslogica hoort in services.

SQL-query's horen in repositories.

Gevoelige waarden horen niet in broncode.

.env-bestanden met echte secrets mogen niet naar GitLab.

Voltooide werkorders zijn niet meer bewerkbaar.

Autorisatie wordt altijd door de backend afgedwongen.

created_by blijft auditinformatie en wordt niet gebruikt als vervanging voor de actuele toegangstoewijzing.

Productie

De applicatie is technisch voorbereid voor deployment op Plesk.

De productieflow is:

GitLab
↓
Frontend en backend build
↓
Express / Node.js
↓
Plesk Node.js
↓
HTTPS-domein

Plesk beheert het Node.js-proces.

Nog te doen voor definitieve productie

De volgende punten worden afgerond zodra de echte productieomgeving bekend is:

echt domein configureren

HTTPS activeren

NODE_ENV=production instellen

FRONTEND_URL naar de echte HTTPS-origin wijzigen

CORS/CSRF beperken tot de echte productie-origin

tweede/off-site back-uplocatie configureren

definitieve smoke test uitvoeren:

login

logout

werkorder aanmaken/bewerken

autosave

foto uploaden/openen

overdracht

gebruikersrechten

voltooide werkorder onveranderbaar

back-up

Plesk Node.js, database, domein en HTTPS definitief configureren

Licentie

Er is momenteel geen afzonderlijke opensourcelicentie opgegeven.

Zonder expliciete licentie mag de broncode niet zonder toestemming worden gekopieerd, aangepast of verspreid.