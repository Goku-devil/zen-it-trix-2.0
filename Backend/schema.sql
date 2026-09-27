CREATE DATABASE IF NOT EXISTS zen_it_trix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zen_it_trix;

CREATE TABLE IF NOT EXISTS registrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    college VARCHAR(180) NOT NULL,
    year_of_study VARCHAR(30) NOT NULL DEFAULT '1st Year',
    event_name VARCHAR(255) NOT NULL,
    technical_event VARCHAR(120) NULL DEFAULT NULL,
    non_technical_event VARCHAR(120) NULL DEFAULT NULL,
    registration_type VARCHAR(20) NOT NULL DEFAULT 'individual',
    team_name VARCHAR(120) NULL DEFAULT NULL,
    team_size TINYINT UNSIGNED NOT NULL DEFAULT 1,
    present TINYINT(1) NOT NULL DEFAULT 0,
    present_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_event_registration (email, event_name),
    INDEX registrations_created_at_idx (created_at)
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    registration_id INT UNSIGNED NOT NULL,
    member_name VARCHAR(120) NOT NULL,
    member_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_team_members_reg_id (registration_id),
    CONSTRAINT fk_team_members_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);
