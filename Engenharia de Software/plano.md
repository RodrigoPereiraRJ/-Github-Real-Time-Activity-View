# Plano de Implementação do Modelo de Dados (DER) - GitHub Monitor

Este documento detalha a estratégia para a modelagem do banco de dados (Diagrama de Entidade-Relacionamento) do projeto **GitHub Monitor API**. O objetivo é traduzir as classes do UML e as regras de negócio do "Levantamento de Requisitos" em um esquema relacional robusto, performático e seguro, utilizando **MySQL 8.0+**.

---

## 1. Diretrizes de Modelagem

*   **Padrão de Nomenclatura**: Snake_case para tabelas e colunas (ex: `audit_logs`, `created_at`).
*   **Identificadores**: Uso de **UUID** (VARCHAR(36) ou BINARY(16)) para todas as chaves primárias, visando segurança e escalabilidade distribuída (evita enumeração sequencial).
*   **Tipos de Dados Específicos**:
    *   `JSON`: Para armazenar payloads de webhooks e detalhes flexíveis (suportado nativamente pelo MySQL).
    *   `TIMESTAMP`: Para auditoria temporal precisa (`created_at`, `updated_at`).
*   **Integridade**: Foreign Keys (FK) obrigatórias em todos os relacionamentos.

---

## 2. Estrutura das Tabelas (Schema Proposto)

Baseado no UML aprovado, propõe-se a criação das seguintes tabelas:

### 2.1. Núcleo de Acesso e Segurança
**Tabela: `users`** (Reflete classe `Usuário`)
*   **Colunas**: `id` (PK), `name`, `email` (Unique), `github_id` (Unique), `avatar_url` (LONGTEXT), `role` (ENUM: 'ADMIN', 'USER'), `created_at`.
*   *Justificativa*: Base para autenticação e autorização (RF10, RF11).

**Tabela: `audit_logs`** (Reflete classe `AuditLog`)
*   **Colunas**: `id` (PK), `user_id` (FK), `action` (Ex: 'DELETE_REPO'), `resource` (Ex: 'Repo:123'), `details` (JSON), `anonymous` (Boolean), `created_at`.
*   *Justificativa*: Requisito de Compliance (Seção 9), retenção de 90 dias. Coluna `anonymous` permite logs de ações não autenticadas.

### 2.2. Domínio Principal
**Tabela: `repositories`** (Reflete classe `Repositório`)
*   **Colunas**: `id` (PK), `user_id` (FK), `github_repo_id` (Unique), `name`, `owner`, `url`, `webhook_secret` (Criptografado), `language` (Ex: 'Java'), `last_synced_at`, `created_at`.
*   *Justificativa*: O `webhook_secret` é crítico para o RF03 (Validação HMAC). Coluna `language` facilita filtros e métricas.

**Tabela: `contributors`** (Reflete classe `Contribuidor`)
*   **Colunas**: `id` (PK), `github_login` (Unique), `avatar_url`, `created_at`.
*   *Justificativa*: Normalização para evitar repetição de dados de contribuidores em cada evento e facilitar o "Ranking de Contribuidores" (RF06).

### 2.3. Eventos e Métricas
**Tabela: `events`** (Reflete classe `Evento`)
*   **Colunas**: `id` (PK), `repository_id` (FK), `contributor_id` (FK), `type` (Ex: 'PUSH', 'PR', 'CREATE'), `delivery_id` (Unique - Idempotência RF04), `payload` (JSON), `created_at`.
*   *Justificativa*: Tabela central de alto volume. O `delivery_id` garante que não processemos o mesmo webhook duas vezes. O `payload` JSON permite flexibilidade para diferentes tipos de eventos.

### 2.4. Monitoramento e Alertas
**Tabela: `alerts`** (Reflete classe `Alerta`)
*   **Colunas**: `id` (PK), `event_id` (FK), `repository_id` (FK), `rule_type` (Ex: 'HIGH_FREQUENCY_COMMITS'), `severity` (ENUM: 'INFO', 'WARNING', 'CRITICAL'), `message`, `status` (ENUM: 'OPEN', 'RESOLVED'), `created_at`, `resolved_at`.
*   *Justificativa*: Histórico de incidentes (RF08). **Nota**: A antiga tabela `alert_rules` foi descontinuada; as regras agora são definidas via código (Enum `AlertRuleType`) para simplificação e performance, referenciadas aqui por `rule_type`.

**Tabela: `notifications`** (Reflete classe `Notificação`)
*   **Colunas**: `id` (PK), `alert_id` (FK), `type` (ENUM: 'EMAIL', 'SLACK', 'DISCORD'), `status` (ENUM: 'PENDING', 'SENT', 'FAILED'), `sent_at`, `created_at`.
*   *Justificativa*: Rastreio de entregas de notificações.

---

## 3. Estratégia de Índices (Performance)

Para atender aos requisitos de latência (<300ms p95 - RNF05), os seguintes índices são planejados:

1.  **Busca de Eventos**: Índice composto `(repository_id, type, created_at)` na tabela `events` para filtragem rápida e ordenação temporal.
2.  **Idempotência**: Índice Unique em `events(delivery_id)` para rejeição rápida de duplicatas.
3.  **Métricas**: Índices nas colunas de data em `events` e `alerts` para agilização de queries de agregação (COUNT/GROUP BY).
4.  **Busca de Contribuidores**: Índice em `contributors(github_login)`.
