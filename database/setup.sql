CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(255)
        NOT NULL
        UNIQUE,

    password_hash VARCHAR(255)
        NOT NULL,

    role ENUM(
        'owner',
        'admin',
        'medewerker'
    )
        NOT NULL
        DEFAULT 'medewerker',

    is_deleted BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    deleted_at DATETIME
        NULL
        DEFAULT NULL,

    token_version INT
        NOT NULL
        DEFAULT 0,

    mfa_enabled BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    mfa_secret TEXT
        NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS werkorders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    werkorder_id VARCHAR(100)
        NOT NULL,

    aankomsttijd TIME NULL,

    eindtijd TIME NULL,

    datum DATE NOT NULL,

    uitgevoerde_werkzaamheden
        TEXT NULL,

    status ENUM(
        'Voltooid',
        'Niet Voltooid',
        'In Afwachting'
    ) NULL,

    is_voltooid BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_deleted BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    deleted_at DATETIME
        NULL
        DEFAULT NULL,

    deleted_by INT NULL,

    created_by INT NULL,

    assigned_to INT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_werkorders_created_by
        FOREIGN KEY (
            created_by
        )
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_werkorders_assigned_user
        FOREIGN KEY (
            assigned_to
        )
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_werkorders_deleted_by
        FOREIGN KEY (
            deleted_by
        )
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

    naam VARCHAR(255)
        NOT NULL,

    aantal DECIMAL(10,2)
        NOT NULL,

    eenheid VARCHAR(50)
        DEFAULT NULL,

    CONSTRAINT fk_materialen_werkorder
        FOREIGN KEY (
            werkorder_id
        )
        REFERENCES werkorders(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    werkorder_id INT NOT NULL,

    beschrijving TEXT NULL,

    bestandspad VARCHAR(500)
        NOT NULL,

    genomen_op DATETIME
        NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fotos_werkorder
        FOREIGN KEY (
            werkorder_id
        )
        REFERENCES werkorders(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS werkorder_access (
    id INT AUTO_INCREMENT PRIMARY KEY,

    werkorder_id INT NOT NULL,

    user_id INT NOT NULL,

    granted_by INT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_werkorder_access
        UNIQUE (
            werkorder_id,
            user_id
        ),

    CONSTRAINT fk_werkorder_access_werkorder
        FOREIGN KEY (
            werkorder_id
        )
        REFERENCES werkorders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_werkorder_access_user
        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_werkorder_access_granted_by
        FOREIGN KEY (
            granted_by
        )
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS werkorder_assignment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    werkorder_id INT NOT NULL,

    from_user_id INT NULL,

    from_user_email
        VARCHAR(255)
        NULL,

    to_user_id INT NULL,

    to_user_email
        VARCHAR(255)
        NOT NULL,

    changed_by INT NULL,

    changed_by_email
        VARCHAR(255)
        NULL,

    reason TEXT NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_history_werkorder
        FOREIGN KEY (
            werkorder_id
        )
        REFERENCES werkorders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_history_from_user
        FOREIGN KEY (
            from_user_id
        )
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assignment_history_to_user
        FOREIGN KEY (
            to_user_id
        )
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assignment_history_changed_by
        FOREIGN KEY (
            changed_by
        )
        REFERENCES users(id)
        ON DELETE SET NULL
);