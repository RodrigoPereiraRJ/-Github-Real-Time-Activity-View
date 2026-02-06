# Github Monitor

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Status](https://img.shields.io/badge/status-active-success.svg)

## Visão Geral

O **Github Monitor** é uma solução corporativa robusta para monitoramento, auditoria e análise de repositórios do GitHub. Projetado para oferecer visibilidade em tempo real sobre o ciclo de vida de desenvolvimento, o sistema integra coleta de eventos via Webhooks, dashboards analíticos, sistemas de alerta configuráveis e relatórios detalhados.

A aplicação segue uma arquitetura moderna e desacoplada, separando o backend (API RESTful em Java/Spring Boot) do frontend (SPA em React), garantindo escalabilidade, segurança e facilidade de manutenção.

---

## Funcionalidades Principais

### Monitoramento e Auditoria
- **Captura de Eventos**: Integração via Webhooks para monitorar Push, Pull Requests, Issues, Releases e Criação de Repositórios.
- **Logs de Auditoria**: Registro imutável de ações críticas do sistema para conformidade e segurança.
- **Visualização de Diffs**: Interface para visualização de diferenças de código (Diffs) diretamente na plataforma.

### Análise e Relatórios
- **Dashboard Interativo**: Gráficos e métricas em tempo real sobre atividades dos repositórios.
- **Ranking de Contribuidores**: Análise de desempenho e engajamento dos desenvolvedores.
- **Exportação de Dados**: Geração de relatórios em Excel (.xlsx) tanto via Backend (Apache POI) quanto Frontend (SheetJS).

### Notificações e Alertas
- **Alertas Personalizáveis**: Regras de alerta baseadas em tipos de eventos.
- **Notificações Real-Time**: Atualizações via Server-Sent Events (SSE).
- **Integração Desktop**: Notificações nativas do Windows via JNA (Java Native Access).

### Segurança e Acesso
- **Autenticação Dupla**: Suporte a Login tradicional (JWT).
- **Controle de Acesso (RBAC)**: Perfis diferenciados para Administradores e Usuários padrão.

---

## Arquitetura e Modulação

### Backend (API)
O backend foi construído seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, organizado em camadas bem definidas para garantir a separação de responsabilidades.

- **Tecnologia**: Java 21, Spring Boot 3.4.1
- **Gerenciamento de Dependências**: Maven ([pom.xml]
- **Estrutura de Pacotes**:
  - `config`: Configurações de segurança e beans do Spring.
  - `controller`: Endpoints RESTful (API Surface).
  - `service`: Lógica de negócios e regras de validação.
  - `repository`: Camada de persistência de dados (Spring Data JPA).
  - `entity`: Modelagem de domínio (JPA Entities).
  - `dto`: Objetos de transferência de dados para desacoplamento.
  - `security`: Implementação de filtros JWT e validação de assinaturas de Webhook.
  - `exception`: Tratamento global de erros.

**Destaques Técnicos:**
- **Flyway**: Versionamento e migração de banco de dados automatizado.
- **JNA (Java Native Access)**: Integração com APIs nativas do Windows para notificações de sistema.
- **Spring Security + JWT**: Arquitetura de segurança stateless.

### Frontend (Client)
A interface do usuário é uma Single Page Application (SPA) reativa e performática.

- **Tecnologia**: React 19, Vite, TypeScript
- **Estilização**: Tailwind CSS (Design System moderno e responsivo).
- **Gerenciamento de Estado**: React Context API (`authContext`, `themeContext`, `languageContext`).
- **Bibliotecas Chave**:
  - `recharts`: Visualização de dados.
  - `lucide-react`: Iconografia leve.
  - `xlsx`: Manipulação de planilhas no cliente.

### Banco de Dados
- **SGBD**: MySQL 8+
- **Modelagem**: Relacional, normalizado para integridade de dados.
- **Evolução**: Gerenciada via scripts de migração Flyway (`src/main/resources/db/migration`).

---

## Segurança

A segurança é um pilar fundamental do Github Monitor:

1.  **Autenticação Stateless**: Utilização de JSON Web Tokens (JWT) para sessões seguras e escaláveis.
2.  **Validação de Webhooks**: Verificação de assinatura (HMAC SHA-256) para garantir que os eventos recebidos originam-se legitimamente do GitHub.
3.  **Proteção de Dados**: Senhas criptografadas (BCrypt) e ignorância de arquivos sensíveis via `.gitignore`.
4.  **CORS & CSRF**: Configurações restritivas para prevenir ataques comuns na web.

---

## Performance e Disponibilidade

- **Server-Sent Events (SSE)**: Utilizado para atualizações em tempo real, evitando o overhead de polling constante ("long-polling").
- **Paginação e Filtros**: APIs otimizadas para lidar com grandes volumes de dados (ex: logs de auditoria).
- **Otimização de Frontend**: Build otimizado com Vite, Code Splitting e carregamento lazy de recursos.
- **Resiliência de Banco de Dados**: Índices estratégicos nas tabelas principais (`users`, `events`) para consultas rápidas.

---

## Recursos e Ferramentas

- **Swagger / OpenAPI**: Documentação viva da API (acessível via endpoint padrão do Spring Boot se habilitado).
- **Docker Ready**: Arquitetura preparada para containerização (Spring Boot + Static Frontend).
- **Internacionalização (i18n)**: Suporte estrutural para múltiplos idiomas no frontend.
- **Tema Escuro (Dark Mode)**: Suporte nativo a temas visuais com persistência de preferência do usuário.

---

## Instalação e Execução

### Pré-requisitos
- Java 21 JDK
- Node.js 18+
- MySQL 8.0+
- Maven

### 1. Configuração do Backend
```bash
# Navegue até a pasta do backend
cd Github_Monitor

# Configure o banco de dados no application.properties ou variáveis de ambiente
# Execute as migrações e inicie a aplicação
./mvnw spring-boot:run
```

### 2. Configuração do Frontend
```bash
# Navegue até a pasta do frontend
cd Github_Monitor_Client/github-monitor

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

---

## Configuração de Webhooks e Desenvolvimento Local

Para que a aplicação receba eventos do GitHub em tempo real durante o desenvolvimento local, é necessário expor o seu servidor local (`localhost:8080`) para a internet. Recomendamos o uso do **ngrok** para esta tarefa.

### Passo 1: Configurar o Ngrok
1.  Baixe e instale o [ngrok](https://ngrok.com/download).
2.  Autentique-se com seu token (obtido no dashboard do ngrok).
3.  Inicie um túnel para a porta do backend (8080):
    ```bash
    ngrok http 8080
    ```
4.  Copie a URL HTTPS gerada (ex: `https://abcd-123.ngrok-free.app`).

### Passo 2: Configurar o Webhook no GitHub
1.  Vá até as configurações do seu repositório no GitHub: **Settings** -> **Webhooks** -> **Add webhook**.
2.  **Payload URL**: Cole a URL do ngrok seguida do endpoint de webhook da API (ex: `https://abcd-123.ngrok-free.app/api/webhook`).
3.  **Content type**: Selecione `application/json` (Fundamental para o correto parsing do payload).
4.  **Secret**: Insira o segredo configurado no seu `application.properties` (chave `github.webhook.secret`).
5.  **Which events would you like to trigger this webhook?**: Selecione "Let me select individual events" e marque:
    *   Pushes
    *   Pull requests
    *   Issues
    *   Releases
    *   Repositories
6.  Clique em **Add webhook**.

Agora, os eventos do GitHub serão encaminhados instantaneamente para o seu backend local!

---

## Licença

Este projeto é distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
