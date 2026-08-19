CREATE DATABASE IF NOT EXISTS werkorder_db;

USE werkorder_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'owner',
        'admin',
        'medewerker'
    ) NOT NULL DEFAULT 'medewerker',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS werkorders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id VARCHAR(100) NOT NULL,
    aankomsttijd TIME NULL,
    eindtijd TIME NULL,
    datum DATE NOT NULL,
    uitgevoerde_werkzaamheden TEXT NULL,
    status ENUM(
        'Voltooid',
        'Niet Voltooid',
        'In Afwachting'
    ) NULL,
    is_voltooid BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_werkorders_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS materialen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    tip ENUM(
        'klant',
        'bedrijf',
        'verkoop'
    ) NOT NULL,
    naam VARCHAR(255) NOT NULL,
    aantal DECIMAL(10,2) NOT NULL,
    eenheid VARCHAR(50) DEFAULT NULL,

    CONSTRAINT fk_materialen_werkorder
        FOREIGN KEY (werkorder_id)
        REFERENCES werkorders(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    werkorder_id INT NOT NULL,
    beschrijving TEXT NULL,
    bestandspad VARCHAR(500) NOT NULL,
    genomen_op DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fotos_werkorder
        FOREIGN KEY (werkorder_id)
        REFERENCES werkorders(id)
        ON DELETE CASCADE
);