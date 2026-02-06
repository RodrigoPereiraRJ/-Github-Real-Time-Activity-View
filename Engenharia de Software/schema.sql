-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS github_monitor;
USE github_monitor;

-- Tabela de Usuários (Autenticação via GitHub OAuth)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY, -- UUID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    github_id VARCHAR(255) UNIQUE NOT NULL,
    avatar_url LONGTEXT,
    role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_github_id (github_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Repositórios Monitorados
CREATE TABLE IF NOT EXISTS repositories (
    id CHAR(36) PRIMARY KEY, -- UUID
    user_id CHAR(36) NOT NULL,
    github_repo_id VARCHAR(255) UNIQUE NOT NULL, -- ID original do GitHub
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(255), -- Segredo criptografado
    language VARCHAR(50),
    last_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repositories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_repositories_owner (owner)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Contribuidores (Autores dos eventos)
CREATE TABLE IF NOT EXISTS contributors (
    id CHAR(36) PRIMARY KEY, -- UUID
    github_login VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contributors_login (github_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Eventos (Push, PR, Issues, etc)
CREATE TABLE IF NOT EXISTS events (
    id CHAR(36) PRIMARY KEY, -- UUID
    repository_id CHAR(36) NOT NULL,
    contributor_id CHAR(36),
    type ENUM('PUSH', 'PULL_REQUEST', 'ISSUE', 'RELEASE', 'CREATE') NOT NULL,
    delivery_id VARCHAR(255) UNIQUE NOT NULL, -- Idempotência do GitHub
    payload JSON, -- Armazena o corpo simplificado do evento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_repository FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    CONSTRAINT fk_events_contributor FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL,
    INDEX idx_events_repository_date (repository_id, created_at),
    INDEX idx_events_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Alertas Disparados
CREATE TABLE IF NOT EXISTS alerts (
    id CHAR(36) PRIMARY KEY, -- UUID
    event_id CHAR(36),
    repository_id CHAR(36) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- Ex: HIGH_FREQUENCY_COMMITS
    severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('OPEN', 'RESOLVED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_alerts_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_repository FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY, -- UUID
    user_id CHAR(36),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details JSON,
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Notificações (Histórico de envios)
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY, -- UUID
    alert_id CHAR(36) NOT NULL,
    type ENUM('EMAIL', 'SLACK', 'DISCORD') NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
