-- Schema Consolidado (V1 a V6) adaptado para PostgreSQL
-- Este arquivo representa o estado final do banco de dados, combinando todas as migrações.
-- Ajustado para usar VARCHAR em vez de ENUM nativo para compatibilidade simplificada com JPA/Hibernate.

-- Habilita extensão para gerar UUIDs (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (V6: avatar_url TEXT)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    github_id VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'USER', -- Enum: ADMIN, USER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    matricula VARCHAR(255) UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- 2. Tabela de Repositórios Monitorados (V5: language)
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    github_repo_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(255),
    language VARCHAR(50),
    last_synced_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repositories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner);

-- 3. Tabela de Contribuidores
CREATE TABLE IF NOT EXISTS contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_login VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contributors_login ON contributors(github_login);

-- 4. Tabela de Eventos
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL,
    contributor_id UUID,
    type VARCHAR(20) NOT NULL, -- Enum: PUSH, PULL_REQUEST, ISSUE, RELEASE, CREATE
    delivery_id VARCHAR(255) UNIQUE NOT NULL,
    payload JSONB, -- JSONB é melhor que JSON no Postgres
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_repository FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    CONSTRAINT fk_events_contributor FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_events_repository_date ON events(repository_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- 5. Tabela de Alertas Disparados (V3: Refatorado)
-- Nota: A tabela 'alert_rules' foi removida na V3, então não a criamos aqui.
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID,
    repository_id UUID NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- Enum: INFO, WARNING, CRITICAL
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN', -- Enum: OPEN, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_alerts_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_repository FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- 6. Tabela de Logs de Auditoria (V4: anonymous)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details JSONB,
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 7. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL, -- Enum: EMAIL, SLACK, DISCORD
    status VARCHAR(20) DEFAULT 'PENDING', -- Enum: PENDING, SENT, FAILED
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);
