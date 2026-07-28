İşte README.md dosyasına birebir, satır satır kopyalanacak temiz metin — hiçbir ekstra işaret (backtick, "markdown" yazısı) olmadan:

Formulier - Opleverformulier Werkorder

Dutch iş emri teslim formu uygulaması. Saha çalışanları formu doldurup gönderir, admin kullanıcılar giriş yaparak tüm gönderilen formları görüntüleyebilir.

Teknoloji Stack'i

Backend: Node.js, TypeScript, Express, MySQL (mysql2), JWT (jsonwebtoken), bcrypt, multer
Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
Veritabanı: MySQL 8.0 (Docker container)
Mimari: Controller → Service → Repository katmanlı yapı (OOP)

Proje Yapısı

formulier/
├── backend/ # Express API (auth, CRUD, foto upload)
├── frontend/ # React form + admin panel
├── database/ # MySQL şema dosyası
└── docker-compose.yml

Kurulum
Gereksinimler
Node.js (v18+)
Docker Desktop
npm
1. Veritabanını Başlat

docker compose up -d

Bu, MySQL 8.0 container'ını localhost:3307 portunda başlatır (host makinede 3306 dolu olduğu için 3307 kullanılıyor).

Şemayı yükle:

Get-Content database/schema.sql | docker exec -i formulier_mysql mysql -u formulier_user -pformulier_sifre_123 formulier_db

2. Backend Kurulumu

cd backend
npm install

backend/.env dosyasını oluştur:

DB_HOST=localhost
DB_PORT=3307
DB_USER=formulier_user
DB_PASSWORD=formulier_sifre_123
DB_NAME=formulier_db
JWT_SECRET=guclu-bir-secret-yazin
PORT=3000

İlk admin kullanıcısını oluştur:

npx ts-node src/createAdmin.ts

Varsayılan giriş: admin@formulier.nl / admin123 (kaynak dosyada değiştirilebilir)

Backend'i başlat:

npm run dev

API şu adreste çalışır: http://localhost:3000

3. Frontend Kurulumu

cd frontend
npm install
npm run dev

Uygulama şu adreste çalışır: http://localhost:5173

Kullanım
Form doldurma: http://localhost:5173/ — herkes erişebilir, giriş gerekmez
Admin girişi: http://localhost:5173/admin/login
Tüm formları görüntüleme: http://localhost:5173/admin/werkorders — giriş yapılması zorunlu
API Endpoint'leri
Method	Endpoint	Açıklama	Auth
POST	/api/werkorders	Yeni werkorder oluştur	Hayır
GET	/api/werkorders	Tüm werkorder'ları listele	Evet
GET	/api/werkorders/:id	Tek werkorder detayı	Evet
POST	/api/werkorders/:id/fotos	Fotoğraf yükle	Hayır
POST	/api/auth/login	Admin girişi (JWT döner)	-
Veritabanı Şeması
werkorders — ana iş emri kayıtları
materialen — kullanılan/teslim edilen malzemeler (tip: klant/bedrijf/verkoop)
fotos — yüklenen fotoğraflar ve açıklamaları
users — admin kullanıcılar (bcrypt ile hash'lenmiş şifreler)