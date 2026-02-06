-- V3__Refactor_Alerts.sql
-- Refatoração da tabela de alertas para remover dependência da tabela alert_rules (agora obsoleta)
-- e adicionar campos necessários para as regras hardcoded.

-- 0. Limpar alertas existentes para evitar erros de integridade com novas colunas NOT NULL
DELETE FROM notifications;
DELETE FROM alerts;

-- 1. Remover Foreign Key para alert_rules
ALTER TABLE alerts DROP FOREIGN KEY fk_alerts_rule;

-- 2. Remover coluna rule_id
ALTER TABLE alerts DROP COLUMN rule_id;

-- 3. Adicionar coluna repository_id
ALTER TABLE alerts ADD COLUMN repository_id CHAR(36) NOT NULL;
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_repository FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE;

-- 4. Adicionar coluna rule_type
ALTER TABLE alerts ADD COLUMN rule_type VARCHAR(50) NOT NULL;

-- 5. Remover tabela alert_rules
DROP TABLE alert_rules;
