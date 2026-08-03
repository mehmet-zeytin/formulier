-- Gebruikers tabel (voor login - personen die het adminpaneel betreden)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hoofdwerkordertabel
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

-- Materialentabel (alle 3 secties bevinden zich hier, gescheiden door de type-kolom)
CREATE TABLE materialen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    tip ENUM('klant', 'bedrijf', 'verkoop') NOT NULL,
    naam VARCHAR(255) NOT NULL,
    aantal DECIMAL(10,2) NOT NULL,
    eenheid VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (werkorder_id) REFERENCES werkorders(id) ON DELETE CASCADE
);

-- Fototabel
CREATE TABLE fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    beschrijving TEXT,
    bestandspad VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (werkorder_id) REFERENCES werkorders(id) ON DELETE CASCADE
);