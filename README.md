Formulier - Opleverformulier Werkorder
Nederlandse app voor werkorder-opleverformulieren. Buitendienstmedewerkers vullen het formulier in en sturen het op, beheerders kunnen inloggen om alle ingediende formulieren te bekijken.
Technologie-stack
Backend: Node.js, TypeScript, Express, MySQL (mysql2), JWT (jsonwebtoken), bcrypt, multer
Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
Database: MySQL 8.0 (Docker-container)
Architectuur: Controller → Service → Repository gelaagde structuur (OOP)
Projectstructuur
formulier/
├── backend/ # Express API (auth, CRUD, foto-upload)
├── frontend/ # React formulier + adminpaneel
├── database/ # MySQL-schemabestand
└── docker-compose.yml
Installatie
Vereisten
Node.js (v18+)
Docker Desktop
npm

Start de database
docker compose up -d
Hiermee wordt de MySQL 8.0-container gestart op poort localhost:3307 (omdat poort 3306 bezet is op de hostmachine, wordt 3307 gebruikt).
Laad het schema:
Get-Content database/schema.sql | docker exec -i formulier_mysql mysql -u formulier_user -pformulier_sifre_123 formulier_db

Backend-installatie
cd backend
npm install
Maak het bestand backend/.env aan:
DB_HOST=localhost
DB_PORT=3307
DB_USER=formulier_user
DB_PASSWORD=formulier_sifre_123
DB_NAME=formulier_db
JWT_SECRET=schrijf-een-sterke-secret-op
PORT=3000
Maak de eerste beheerder aan:
npx ts-node src/createAdmin.ts
Standaard login: admin@formulier.nl / admin123 (kan in het bronbestand worden gewijzigd)
Start de backend:
npm run dev
De API werkt op: http://localhost:3000

Frontend-installatie
cd frontend
npm install
npm run dev
De applicatie werkt op: http://localhost:5173
Gebruik
Formulier invullen: http://localhost:5173/ — iedereen heeft toegang, inloggen is niet verplicht
Admin-login: http://localhost:5173/admin/login
Alle formulieren bekijken: http://localhost:5173/admin/werkorders — inloggen is verplicht
API-endpoints
Method	Endpoint	Beschrijving	Auth
POST	/api/werkorders	Nieuwe werkorder aanmaken	Nee
GET	/api/werkorders	Alle werkorders weergeven	Ja
GET	/api/werkorders/:id	Details van één werkorder	Ja
POST	/api/werkorders/:id/fotos	Foto uploaden	Nee
POST	/api/auth/login	Admin-login (geeft JWT terug)	-
Databaseschema
werkorders — hoofdregistraties van werkorders
materialen — gebruikte/geleverde materialen (type: klant/bedrijf/verkoop)
fotos — geüploade foto's en beschrijvingen daarvan
users — beheerders (wachtwoorden gehasht met bcrypt)