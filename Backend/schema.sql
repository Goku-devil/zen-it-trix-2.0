CREATE DATABASE IF NOT EXISTS zen_it_trix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zen_it_trix;

CREATE TABLE IF NOT EXISTS registrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    college VARCHAR(180) NOT NULL,
    event_name VARCHAR(120) NOT NULL,
    team_size TINYINT UNSIGNED NOT NULL DEFAULT 1,
    present TINYINT(1) NOT NULL DEFAULT 0,
    present_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_event_registration (email, event_name),
    INDEX registrations_created_at_idx (created_at)
);
