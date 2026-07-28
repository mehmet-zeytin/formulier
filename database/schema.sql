-- Kullanıcılar tablosu (login için - admin panel'e girecek kişiler)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ana iş emri tablosu
CREATE TABLE werkorders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id VARCHAR(100) NOT NULL,
    aankomsttijd TIME NOT NULL,
    eindtijd TIME NOT NULL,
    datum DATE NOT NULL,
    uitgevoerde_werkzaamheden TEXT NOT NULL,
    status ENUM('Voltooid', 'Niet Voltooid', 'In Afwachting') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materyaller tablosu (3 bölümün hepsi burada, tip sütunuyla ayrılıyor)
CREATE TABLE materialen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    tip ENUM('klant', 'bedrijf', 'verkoop') NOT NULL,
    naam VARCHAR(255) NOT NULL,
    aantal DECIMAL(10,2) NOT NULL,
    eenheid VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (werkorder_id) REFERENCES werkorders(id) ON DELETE CASCADE
);

-- Fotoğraflar tablosu
CREATE TABLE fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    beschrijving TEXT,
    bestandspad VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (werkorder_id) REFERENCES werkorders(id) ON DELETE CASCADE
);

