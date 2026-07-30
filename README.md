# Formulier – Opleverformulier Werkorder
## Over het project
Formulier is een Nederlandstalige webapplicatie voor het invullen, versturen en beheren van werkorder-opleverformulieren.

Buitendienstmedewerkers kunnen zonder account een opleverformulier invullen en verzenden. Beheerders kunnen inloggen op het adminpaneel om alle ingediende werkorders te bekijken.

De applicatie bestaat uit een afzonderlijke frontend, backend en MySQL-database.

## Functionaliteiten
### Voor buitendienstmedewerkers
* Werkorder-opleverformulier invullen
* Gebruikte en geleverde materialen registreren
* Foto’s bij een werkorder uploaden
* Foto’s voorzien van een beschrijving
* Formulier zonder account verzenden

### Voor beheerders
* Beveiligd inloggen met e-mailadres en wachtwoord
* Alle ingediende werkorders bekijken
* Details van afzonderlijke werkorders bekijken
* Geregistreerde materialen bekijken
* Geüploade foto’s bekijken
* Toegang tot beveiligde API-routes via een JWT-token

## Technologieën
### Backend
* Node.js
* TypeScript
* Express
* MySQL2
* JSON Web Token
* bcrypt
* Multer

### Frontend
* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios

### Database
* MySQL 8.0
* Docker
* Docker Compose

## Architectuur
De backend maakt gebruik van een gelaagde objectgeoriënteerde architectuur:

**Controller → Service → Repository**

### Controllerlaag
De controllers ontvangen HTTP-verzoeken, controleren de invoer en sturen een antwoord terug naar de frontend.

### Servicelaag
De services bevatten de bedrijfslogica van de applicatie. Deze laag verwerkt gegevens en bepaalt welke acties moeten worden uitgevoerd.

### Repositorylaag
De repositories verzorgen de communicatie met de MySQL-database. Databasequery’s worden zoveel mogelijk buiten de controllers en services gehouden.

Deze structuur zorgt voor een duidelijke scheiding van verantwoordelijkheden en maakt het project eenvoudiger te onderhouden en uit te breiden.

## Projectstructuur

```
formulier/
├── backend/
│   └── Express API voor authenticatie, werkorders en foto-uploads
├── frontend/
│   └── React-formulier en adminpaneel
├── database/
│   └── MySQL-schemabestand
└── docker-compose.yml
```

## Vereisten
Voor het uitvoeren van het project zijn de volgende programma’s nodig:

* Node.js versie 18 of hoger
* npm
* Docker Desktop
* Docker Compose
* Een moderne internetbrowser

## Installatie
### 1. Project downloaden
Kloon de repository:

```
git clone <project-url>
```

Ga vervolgens naar de projectmap:

```
cd formulier
```

Vervang `<project-url>` door de URL van de Git-repository.

## Database starten
Start de MySQL-container vanuit de hoofdmap van het project:

```
docker compose up -d
```

Hiermee wordt een MySQL 8.0-container gestart.

De database is beschikbaar via:

```
localhost:3307
```

Poort `3307` wordt gebruikt omdat poort `3306` op de hostmachine al in gebruik is.

### Databaseschema laden
Voer in PowerShell het volgende commando uit vanuit de hoofdmap van het project:

```
Get-Content database/schema.sql | docker exec -i formulier_mysql mysql -u formulier_user -pformulier_sifre_123 formulier_db
```

Hiermee wordt het databaseschema uit `database/schema.sql` geïmporteerd in de MySQL-container.

### Databasecontainer controleren
Controleer of de container actief is:

```
docker ps
```

De container met de naam `formulier_mysql` moet in de lijst worden weergegeven.

## Backend installeren
Ga naar de backendmap:

```
cd backend
```

Installeer de benodigde pakketten:

```
npm install
```

### Omgevingsvariabelen instellen
Maak in de map `backend` een bestand met de naam `.env`.

Voeg de volgende configuratie toe:

```
DB_HOST=localhost
DB_PORT=3307
DB_USER=formulier_user
DB_PASSWORD=formulier_sifre_123
DB_NAME=formulier_db
JWT_SECRET=schrijf-een-sterke-geheime-sleutel-op
PORT=3000
```

Vervang de waarde van `JWT_SECRET` door een lange en willekeurige geheime sleutel.

Het `.env`-bestand mag niet aan de Git-repository worden toegevoegd.

## Eerste beheerder aanmaken
Voer vanuit de map `backend` het volgende commando uit:

```
npx ts-node src/createAdmin.ts
```

De standaard inloggegevens zijn:

* E-mailadres: `admin@formulier.nl`
* Wachtwoord: `admin123`

De standaardgegevens kunnen in het bijbehorende bronbestand worden gewijzigd.

Wijzig het standaardwachtwoord voordat de applicatie in een productieomgeving wordt gebruikt.

## Backend starten
Start de backend in ontwikkelmodus:

```
npm run dev
```

De API is daarna beschikbaar via:

```
http://localhost:3000
```

## Frontend installeren
Open een nieuwe terminal en ga vanuit de hoofdmap naar de frontendmap:

```
cd frontend
```

Installeer de benodigde pakketten:

```
npm install
```

Start de ontwikkelserver:

```
npm run dev
```

De applicatie is daarna beschikbaar via:

```
http://localhost:5173
```

## Gebruik
### Werkorderformulier invullen
Open de volgende pagina:

```
http://localhost:5173/
```

Het formulier is openbaar toegankelijk. Een gebruiker hoeft niet in te loggen om een werkorder in te vullen en te verzenden.

### Beheerder aanmelden
Open de admin-inlogpagina:

```
http://localhost:5173/admin/login
```

Meld aan met een geldig beheerdersaccount.

### Ingediende werkorders bekijken
Na het inloggen kunnen alle werkorders worden bekeken via:

```
http://localhost:5173/admin/werkorders
```

Voor deze pagina is een geldig JWT-token vereist.

## API-endpoints
| Methode | Endpoint                    | Beschrijving                                         | Authenticatie |
| ------- | --------------------------- | ---------------------------------------------------- | ------------- |
| `POST`  | `/api/werkorders`           | Maakt een nieuwe werkorder aan                       | Nee           |
| `GET`   | `/api/werkorders`           | Geeft alle werkorders terug                          | Ja            |
| `GET`   | `/api/werkorders/:id`       | Geeft de details van één werkorder terug             | Ja            |
| `POST`  | `/api/werkorders/:id/fotos` | Uploadt een foto bij een werkorder                   | Nee           |
| `POST`  | `/api/auth/login`           | Meldt een beheerder aan en geeft een JWT-token terug | Nee           |

## Authenticatie
Beheerders melden zich aan via:

```
POST /api/auth/login
```

Wanneer de inloggegevens correct zijn, geeft de backend een JWT-token terug.

Voor beveiligde routes moet dit token worden meegestuurd in de `Authorization`-header:

```
Authorization: Bearer <jwt-token>
```

Wachtwoorden van beheerders worden niet als leesbare tekst opgeslagen. De wachtwoorden worden met bcrypt gehasht voordat ze in de database worden opgeslagen.

## Databaseschema
### werkorders
Bevat de hoofdgegevens van ingediende werkorders.

Mogelijke gegevens zijn onder andere:

* Klantgegevens
* Werkordergegevens
* Uitgevoerde werkzaamheden
* Opmerkingen
* Datum van oplevering
* Status van de werkorder

### materialen
Bevat materialen die bij een werkorder zijn gebruikt of geleverd.

Een materiaal kan onder een van de volgende categorieën vallen:

* Klant
* Bedrijf
* Verkoop

Elke materiaalregistratie is gekoppeld aan een werkorder.

### fotos
Bevat informatie over geüploade foto’s.

Per foto kunnen onder andere de volgende gegevens worden opgeslagen:

* Bestandsnaam
* Bestandspad
* Beschrijving
* Bijbehorende werkorder

### users
Bevat de beheerdersaccounts.

De wachtwoorden worden met bcrypt gehasht opgeslagen.

## Foto-uploads
Foto’s worden via Multer door de backend verwerkt.

Bij het uploaden moet worden gecontroleerd op:

* Toegestane bestandstypen
* Maximale bestandsgrootte
* Veilige bestandsnamen
* Geldige werkorder-ID
* Correcte opslaglocatie

Geüploade bestanden en uploadmappen moeten waar nodig aan `.gitignore` worden toegevoegd.

## Ontwikkelafspraken
* Alle zichtbare teksten in de applicatie moeten in het Nederlands zijn.
* Alle opmerkingen in de broncode moeten in het Nederlands worden geschreven.
* Functies, klassen en bestanden moeten duidelijke namen hebben.
* Controllers mogen geen uitgebreide bedrijfslogica bevatten.
* Databasequery’s moeten in repositories worden geplaatst.
* Bedrijfslogica moet in services worden geplaatst.
* Gevoelige gegevens mogen niet rechtstreeks in de broncode worden opgeslagen.
* Omgevingsvariabelen moeten via een `.env`-bestand worden ingesteld.
* Het `.env`-bestand en de map `node_modules` mogen niet aan Git worden toegevoegd.
* Foutmeldingen voor gebruikers moeten duidelijk en Nederlandstalig zijn.
* Technische foutdetails mogen in productie niet rechtstreeks aan gebruikers worden getoond.

## Veiligheid
Voor gebruik in een productieomgeving moeten minimaal de volgende maatregelen worden toegepast:

* Gebruik een sterk beheerderswachtwoord.
* Gebruik een lange en willekeurige `JWT_SECRET`.
* Gebruik HTTPS.
* Valideer alle gegevens die via het formulier worden ontvangen.
* Beperk de toegestane bestandstypen bij foto-uploads.
* Stel een maximale bestandsgrootte voor uploads in.
* Gebruik voorbereide SQL-query’s om SQL-injectie te voorkomen.
* Beperk CORS tot toegestane domeinen.
* Voeg rate limiting toe aan de inlogroute.
* Deel het `.env`-bestand nooit openbaar.
* Gebruik niet de standaarddatabasegegevens in een productieomgeving.

## Veelvoorkomende problemen
### Dockercontainer start niet
Controleer of Docker Desktop actief is.

Voer daarna opnieuw uit:

```
docker compose up -d
```

Controleer de status van de containers:

```
docker compose ps
```

### Poort 3307 is al in gebruik
Pas de poort in `docker-compose.yml` aan.

Pas daarna ook `DB_PORT` in `backend/.env` aan.

### Databaseschema wordt niet geladen
Controleer of de containernaam correct is:

```
docker ps
```

Controleer daarnaast of het bestand `database/schema.sql` bestaat en of het PowerShell-commando vanuit de hoofdmap van het project wordt uitgevoerd.

### Backend kan geen verbinding maken met de database
Controleer de volgende waarden in `backend/.env`:

* `DB_HOST`
* `DB_PORT`
* `DB_USER`
* `DB_PASSWORD`
* `DB_NAME`

Controleer ook of de MySQL-container actief is.

### Beheerder kan niet inloggen
Controleer of het beheerdersaccount is aangemaakt:

```
npx ts-node src/createAdmin.ts
```

Controleer daarnaast of het e-mailadres en wachtwoord overeenkomen met de gegevens in het aanmaakscript.

### Frontend kan de backend niet bereiken
Controleer of de backend actief is op:

```
http://localhost:3000
```

Controleer ook de API-basis-URL in de frontendconfiguratie en de CORS-instellingen van de backend.

### Foto-upload werkt niet
Controleer:
* Of de uploadmap bestaat
* Of de backend schrijfrechten heeft
* Of het bestandstype is toegestaan
* Of het bestand niet te groot is
* Of de opgegeven werkorder bestaat

## Productiegebruik
Voor productiegebruik moeten de frontend en backend als productiebuild worden uitgevoerd.

Maak de frontendbuild met:

```
npm run build
```

Compileer de backend volgens de scripts die in `backend/package.json` zijn ingesteld.

Gebruik voor productie bij voorkeur:

* Een reverse proxy, zoals Nginx
* HTTPS-certificaten
* Een procesbeheerder, zoals PM2
* Een afzonderlijke productiedatabase
* Sterke en unieke databasegegevens
* Automatische back-ups
* Centrale foutregistratie

## Licentie
Voeg in deze sectie de licentie van het project toe.

Wanneer geen licentie is opgegeven, mag de broncode niet zonder toestemming worden gekopieerd, aangepast of verspreid.