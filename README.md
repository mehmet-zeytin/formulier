Formulier – Opleverformulier Werkorder

Over het project

Formulier is een Nederlandstalige webapplicatie voor het invullen, opslaan, beheren en afronden van werkorders.

Gebruikers melden zich aan met een account. De applicatie kent drie rollen:

owner – hoofdbeheerder

admin – beheerder

medewerker – medewerker

Een medewerker kan alleen zijn eigen werkorders en concepten bekijken en bewerken. Een admin en de owner kunnen alle werkorders bekijken. De owner heeft daarnaast volledige controle over admins en medewerkers.

De applicatie bestaat uit:

React/Vite frontend

Express/TypeScript backend

MySQL 8.0 database

Functionaliteiten

Werkorders

Nieuwe werkorder als concept aanmaken

Concept automatisch opslaan tijdens het invullen

Concept later verder bewerken

Materialen registreren

Eenheid per materiaal vastleggen

Foto's uploaden

Beschrijving bij foto's opslaan

Tijdstip van selecteren/opnemen van foto's bewaren via genomen_op

Werkorder definitief voltooien

Voltooide werkorders beschermen tegen verdere wijzigingen

Zoeken op werkorder-ID en uitgevoerde werkzaamheden

Filteren op status: Alle, Concept, Voltooid, Niet Voltooid en In Afwachting

Gebruikersbeheer

Owner

De owner kan:

alle werkorders en concepten bekijken

medewerkers aanmaken

admins aanmaken

admins en medewerkers verwijderen

wachtwoorden van admins en medewerkers wijzigen

medewerkers promoveren naar admin

admins terugzetten naar medewerker

Het owner-account zelf kan via de applicatie niet worden verwijderd en de owner-rol kan niet worden gewijzigd.

Admin

Een admin kan:

alle werkorders en concepten bekijken

medewerkers aanmaken

medewerkers verwijderen

wachtwoorden van medewerkers wijzigen

Een admin kan niet:

een nieuwe admin aanmaken

de rol van een gebruiker wijzigen

een andere admin beheren

het owner-account beheren

Medewerker

Een medewerker kan:

alleen eigen werkorders bekijken

alleen eigen concepten bekijken

eigen concepten aanmaken en bewerken

eigen werkorders voltooien

Een medewerker heeft geen toegang tot gebruikersbeheer.

Technologieën

Backend

Node.js

TypeScript

Express

MySQL2

JSON Web Token

bcrypt

Multer

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

Controllers ontvangen HTTP-verzoeken en sturen responses terug. Services bevatten de bedrijfslogica en autorisatieregels. Repositories verzorgen de SQL-query's en communicatie met MySQL.

Projectstructuur

werkorder-formulier/
├── backend/
│   ├── src/
│   └── .env
├── frontend/
│   └── src/
├── database/
│   └── setup.sql
├── database-backups/
│   └── lokale back-ups, niet committen
├── package.json
└── README.md

Vereisten

Voor lokaal gebruik zijn nodig:

Node.js 18 of hoger

npm

MySQL 8.0

Een moderne browser

Windows wanneer het meegeleverde mysql:start-script wordt gebruikt

De root package.json start de Windows-service MySQL80. Als MySQL onder een andere servicenaam draait, moet het script worden aangepast.

Installatie vanaf GitLab

1. Repository klonen

git clone <project-url>
cd werkorder-formulier

Vervang <project-url> door de GitLab-URL van het project.

2. Dependencies installeren

npm install
npm install --prefix backend
npm install --prefix frontend

Dit hoeft alleen opnieuw wanneer dependencies zijn gewijzigd.

3. MySQL voorbereiden

Controleer op Windows de servicenaam:

Get-Service *MySQL*

In de huidige root package.json wordt uitgegaan van:

MySQL80

Als de service anders heet, pas mysql:start in de root package.json aan.

4. Database en databasegebruiker aanmaken

Log in als MySQL-root:

& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

Voer daarna in MySQL uit:

CREATE DATABASE IF NOT EXISTS werkorder_db;

CREATE USER IF NOT EXISTS 'formulier_user'@'localhost'
IDENTIFIED BY 'KIES_HIER_EEN_STERK_WACHTWOORD';

GRANT ALL PRIVILEGES
ON werkorder_db.*
TO 'formulier_user'@'localhost';

FLUSH PRIVILEGES;

Gebruik in een echte omgeving een eigen sterk wachtwoord.

5. Databaseschema laden

Vanuit de hoofdmap van het project:

Get-Content ".\database\setup.sql" |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
    -u formulier_user `
    -p `
    werkorder_db

Voer het databasewachtwoord in wanneer MySQL daarom vraagt.

6. Backend .env aanmaken

Maak dit bestand:

backend/.env

Voorbeeld:

DB_HOST=localhost
DB_PORT=3306
DB_USER=formulier_user
DB_PASSWORD=KIES_HIER_HETZELFDE_DATABASEWACHTWOORD
DB_NAME=werkorder_db

JWT_SECRET=KIES_HIER_EEN_LANGE_WILLEKEURIGE_GEHEIME_SLEUTEL
PORT=3000

Belangrijk:

Commit backend/.env nooit naar GitLab.

Gebruik geen standaardwachtwoorden in productie.

Gebruik een lange en willekeurige JWT_SECRET.

Eerste owner-account aanmaken

Na een volledig nieuwe database bestaat er nog geen owner-account.

Ga naar de backendmap:

cd backend

Genereer een bcrypt-hash:

node -e "const bcrypt=require('bcrypt'); bcrypt.hash('KIES_EEN_STERK_WACHTWOORD',12).then(console.log)"

Kopieer de volledige hash en voer daarna in MySQL uit:

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

Gebruik vervolgens het gekozen wachtwoord om in te loggen. Het owner-account kan daarna vanuit de applicatie admins en medewerkers aanmaken.

Applicatie starten

Vanuit de hoofdmap:

npm run dev

Het root-script doet achtereenvolgens:

MySQL80 starten indien nodig
↓
backend starten
↓
frontend starten

Daarna zijn beschikbaar:

Frontend: http://localhost:5173
Backend:  http://localhost:3000

Windows kan administratorrechten vereisen om MySQL80 via Start-Service te starten. Bij Access is denied moet PowerShell als administrator worden geopend.

Belangrijke routes

/login
/werkorders
/werkorders/new
/werkorders/:id
/werkorders/:id/edit
/users

/users is alleen toegankelijk voor owner en admin.

Een medewerker die /users probeert te openen wordt teruggestuurd naar /werkorders.

Werkorderdetailroutes worden ook in de backend op eigenaarschap en rol gecontroleerd.

Authenticatie

Aanmelden verloopt via:

POST /api/auth/login

Na succesvolle authenticatie retourneert de backend een JWT-token. Beveiligde API-verzoeken sturen het token mee als:

Authorization: Bearer <jwt-token>

Het token bevat onder andere userId, email, role, iat en exp. Tokens zijn 8 uur geldig.

Wanneer JWT_SECRET wordt gewijzigd, worden bestaande sessies ongeldig en moeten gebruikers opnieuw inloggen.

Wachtwoorden worden met bcrypt gehasht opgeslagen.

Belangrijkste API-routes

Authenticatie en gebruikers

Methode

Endpoint

Beschrijving

POST

/api/auth/login

Aanmelden

GET

/api/auth/users

Gebruikers ophalen

POST

/api/auth/users

Gebruiker aanmaken

PATCH

/api/auth/users/:id/password

Wachtwoord wijzigen

PATCH

/api/auth/users/:id/role

Rol wijzigen

DELETE

/api/auth/users/:id

Gebruiker verwijderen

Werkorders

Methode

Endpoint

Beschrijving

GET

/api/werkorders

Toegankelijke werkorders ophalen

GET

/api/werkorders/:id

Werkorderdetail ophalen

POST

/api/werkorders/drafts

Nieuw concept aanmaken

GET

/api/werkorders/drafts

Concepten ophalen

PATCH

/api/werkorders/:id

Concept bijwerken

PUT

/api/werkorders/:id/materialen

Materialen van concept opslaan

POST

/api/werkorders/:id/complete

Concept voltooien

POST

/api/werkorders/:id/fotos

Foto uploaden

Foto- en werkorderroutes zijn beveiligd met authenticatie en autorisatie.

Autorisatiemodel

Actie

Owner

Admin

Medewerker

Eigen werkorders bekijken

Ja

Ja

Ja

Alle werkorders bekijken

Ja

Ja

Nee

Alle concepten bekijken

Ja

Ja

Nee

Eigen concept bewerken

Ja

Ja

Ja

Concept van andere gebruiker bewerken

Ja

Ja

Nee

Gebruikersbeheer openen

Ja

Ja

Nee

Medewerker aanmaken

Ja

Ja

Nee

Admin aanmaken

Ja

Nee

Nee

Medewerker verwijderen

Ja

Ja

Nee

Admin verwijderen

Ja

Nee

Nee

Medewerkerwachtwoord wijzigen

Ja

Ja

Nee

Adminwachtwoord wijzigen

Ja

Nee

Nee

Rollen wijzigen

Ja

Nee

Nee

Owner verwijderen

Nee

Nee

Nee

Owner-rol wijzigen

Nee

Nee

Nee

Database

De applicatie gebruikt vier hoofdtabellen:

users

Bevat gebruikersaccounts met onder andere:

id

email

password_hash

role

created_at

Rollen: owner, admin, medewerker.

werkorders

Bevat werkorders en concepten met onder andere:

werkorder_id

aankomsttijd

eindtijd

datum

uitgevoerde_werkzaamheden

status

is_voltooid

created_by

created_at

updated_at

created_by bepaalt welke medewerker eigenaar is van een werkorder.

materialen

Bevat materialen die aan een werkorder gekoppeld zijn, inclusief naam, aantal, eenheid en categorie (klant, bedrijf, verkoop).

fotos

Bevat informatie over geüploade foto's, waaronder werkorder-ID, bestandspad, beschrijving, genomen_op en created_at.

Concepten en automatisch opslaan

Nieuwe werkorders worden eerst als concept opgeslagen. Tijdens het invullen worden wijzigingen automatisch opgeslagen na een korte vertraging.

De frontend kan onder andere de volgende statussen tonen:

Niet opgeslagen
Automatisch opslaan...
Automatisch opgeslagen
Fout bij automatisch opslaan

Foto's worden niet door de automatische opslag geüpload; foto-upload gebeurt afzonderlijk.

Een voltooide werkorder kan daarna niet meer als concept worden gewijzigd.

Zoeken en filteren

Op de werkorderpagina kan worden gezocht op:

werkorder-ID

uitgevoerde werkzaamheden

Er kan worden gefilterd op:

Alle

Concept

Voltooid

Niet Voltooid

In Afwachting

Filtering gebeurt alleen op werkorders waarvoor de huidige gebruiker via de backend toegang heeft.

Builds controleren

Backend:

cd backend
npx tsc --noEmit

Frontend:

cd frontend
npm run build

Voor oplevering moeten beide zonder fouten eindigen.

.gitignore

Minimaal aanbevolen:

node_modules/
dist/

.env
backend/.env
frontend/.env

database-backups/

database/setup.sql moet wel in GitLab blijven staan, omdat dit nodig is om een nieuwe database op te zetten.

Veelvoorkomende problemen

package.json niet gevonden

Voer npm install en npm run dev vanuit de hoofdmap werkorder-formulier/ uit.

MySQL-service kan niet worden gestart

Get-Service MySQL80

Handmatig starten:

Start-Service MySQL80

Bij Access is denied moet PowerShell als administrator worden gestart.

Access denied for user 'formulier_user'@'localhost'

Controleer handmatig:

& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
  -u formulier_user `
  -p `
  werkorder_db

Controleer daarnaast of backend/.env hetzelfde databasewachtwoord gebruikt.

Backend kan database niet bereiken

Controleer in backend/.env:

DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME

De huidige lokale configuratie gebruikt localhost, poort 3306 en database werkorder_db.

Login geeft 401 Unauthorized

Controleer eerst of de databaseverbinding werkt. Controleer daarna of het account bestaat en of het gebruikte wachtwoord overeenkomt met de bcrypt-hash.

Frontend kan backend niet bereiken

Controleer of de backend draait op http://localhost:3000 en de frontend op http://localhost:5173.

Ontwikkelafspraken

Alle zichtbare applicatieteksten zijn Nederlandstalig.

Controllers bevatten zo min mogelijk bedrijfslogica.

Bedrijfslogica hoort in services.

SQL-query's horen in repositories.

Gevoelige waarden horen in .env.

.env mag niet naar GitLab worden gepusht.

Voltooide werkorders zijn niet meer bewerkbaar.

Autorisatie moet altijd door de backend worden afgedwongen; alleen knoppen verbergen in de frontend is niet voldoende.

Veiligheid

Voor productiegebruik:

gebruik een sterke en unieke JWT_SECRET

gebruik sterke databasegegevens

gebruik sterke gebruikerswachtwoorden

gebruik HTTPS

beperk CORS tot toegestane domeinen

valideer alle invoer

beperk bestandstypen en bestandsgrootte bij uploads

gebruik prepared statements

voeg rate limiting toe aan login

deel .env nooit openbaar

maak periodieke databaseback-ups

Openstaand onderdeel

De belangrijkste nog openstaande functionele keuze is:

Wilt u dat er automatisch een e-mail wordt verstuurd zodra een werkorder is voltooid?

Als dit gewenst is, moet nog worden bepaald:

naar welk e-mailadres de e-mail wordt gestuurd

welke gegevens in de e-mail komen

op welk moment de e-mail wordt verzonden

welke mailserver of e-mailprovider wordt gebruikt

Productiegebruik

Voor productie wordt aanbevolen:

frontend production build

gecompileerde backend

HTTPS

reverse proxy, bijvoorbeeld Nginx

procesbeheerder, bijvoorbeeld PM2

afzonderlijke productiedatabase

automatische back-ups

centrale logging

veilige opslag van secrets

De huidige npm run dev-flow is bedoeld voor lokale ontwikkeling.

Licentie

Voeg hier de gewenste licentie toe.

Wanneer geen licentie is opgegeven, mag de broncode niet zonder toestemming worden gekopieerd, aangepast of verspreid.