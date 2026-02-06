# Levantamento de Requisitos

## Projeto: GitHub Monitor API

- Versão: 1.0
- Autor: Rodrigo Pereira de Souza
- Tipo: Projeto pessoal
- Data: 2026-01-22
- Status: Em revisão
- Responsável pela aprovação: Sandro Souza Monteiro (Tech Lead)

---

## 1. Visão Geral do Projeto

O **GitHub Monitor API** é uma API backend desenvolvida em **Java com Spring Boot**, cujo objetivo é monitorar, registrar e disponibilizar informações sobre atividades de repositórios GitHub em tempo quase real, fornecendo métricas, histórico de eventos e mecanismos de alerta baseados em regras configuráveis.

O projeto adota uma abordagem **API-first**, com foco em integração, observabilidade e boas práticas de arquitetura backend.

---

## 2. Objetivos e Critérios de Sucesso do MVP

### 2.1 Objetivos

- Centralizar eventos de repositórios GitHub para consulta e métricas
- Oferecer alertas configuráveis baseados em regras de negócio
- Garantir integração segura e confiável via Webhooks

---

### 2.2 Critérios de Sucesso do MVP

- Processar pelo menos 99% dos Webhooks recebidos sem falha
- Disponibilizar métricas básicas para repositórios cadastrados
- Disponibilizar histórico de eventos consultável com filtros e paginação
- Manter tempo de resposta p95 da API abaixo de 300 ms em endpoints de consulta

---

## 3. Escopo do Projeto

### 3.1 Funcionalidades Dentro do Escopo

1 Monitoramento de repositórios GitHub  
2 Integração via Webhooks do GitHub  
3 Registro de eventos (commits, pull requests, issues, releases)  
4 Exposição de métricas e histórico via API REST  
5 Sistema de alertas baseados em regras  
6 Autenticação e autorização de usuários  
7 Notificações internas via API (sem integrações externas)

---

### 3.2 Funcionalidades Fora do Escopo (nesta fase)

 Integração com **GitHub Actions / Pipelines**  
 Recebimento e análise de eventos de CI/CD  
 Uso direto de Kafka ou RabbitMQ no MVP  
 Implementação completa de Arquitetura Hexagonal no MVP

Essas funcionalidades estão **explicitamente fora do escopo inicial**, mas previstas como **evolução futura**.

---

## 4. Stakeholders e Usuários

### 4.1 Tipos de Usuários

- Usuário autenticado via credenciais locais (JWT)
    
- Desenvolvedores ou equipes que desejam monitorar seus repositórios
    
- Administradores do sistema
    

---

## 5. Requisitos Funcionais (RF)

### RF01 – Cadastro de Repositórios

O sistema deve permitir o cadastro de repositórios GitHub para monitoramento.

Critérios de Aceite:
- Permitir cadastro por owner/name ou URL do repositório
- Validar existência do repositório e permissão do usuário
- Listar e remover repositórios cadastrados

---

### RF02 – Recebimento de Eventos via Webhook

O sistema deve receber eventos enviados pelo GitHub Webhook, incluindo:

- Push (commits)
    
- Pull Requests
    
- Issues
    
- Releases

- Create (Branches/Tags)
    
Critérios de Aceite:
- Disponibilizar endpoint público para recebimento de Webhooks
- Processar apenas eventos suportados e ignorar eventos não previstos
- Responder 2xx em até 2 segundos para eventos válidos



### RF03 – Validação de Webhook

O sistema deve validar a autenticidade dos eventos recebidos por meio de assinatura HMAC.

Critérios de Aceite:
- Validar assinatura X-Hub-Signature-256 em todos os Webhooks
- Rejeitar requisições inválidas com 401 ou 403
- Registrar tentativa inválida com motivo e timestamp

---

### RF04 – Registro de Eventos

O sistema deve persistir os eventos recebidos em banco de dados, mantendo histórico consultável.

Critérios de Aceite:
- Persistir payload normalizado e metadados do evento
- Garantir idempotência por delivery_id do GitHub
- Manter histórico consultável por no mínimo 12 meses

---

### RF05 – Consulta de Atividades

O sistema deve disponibilizar endpoints REST para consulta de atividades por:

- Repositório
    
- Tipo de evento
    
- Período
    
Critérios de Aceite:
- Suportar filtros combinados e paginação
- Ordenar resultados por data do evento
- Retornar total de registros e metadados de paginação



### RF06 – Métricas de Repositório

O sistema deve fornecer métricas agregadas, tais como:

- Quantidade de commits por período
    
- Pull requests abertas, fechadas e mergeadas
    
- Issues ativas e encerradas
    
- Ranking de contribuidores
    
Critérios de Aceite:
- Calcular métricas por período e por repositório
- Retornar agregados em formato consistente com API
- Atualizar métricas em até 5 minutos após evento



### RF07 – Sistema de Alertas

O sistema deve permitir a definição de regras de alerta, como:

- Commits fora do horário padrão
    
- Número excessivo de commits em curto período
    
- Commits diretos na branch principal
    
Critérios de Aceite:
- Permitir criar, editar, ativar e desativar regras
- Suportar parâmetros configuráveis por regra
- Aplicar regras a eventos em tempo quase real



### RF08 – Registro de Alertas

O sistema deve registrar eventos que disparem alertas e disponibilizar seu histórico via API.

Critérios de Aceite:
- Registrar alertas com referência ao evento e regra
- Expor endpoint de consulta com filtros e paginação
- Manter histórico de alertas por no mínimo 12 meses

---

### RF09 – Notificações Desktop (SystemTray)

O sistema deve disponibilizar notificações nativas no ambiente desktop do servidor (Windows), utilizando a bandeja do sistema (SystemTray).

Critérios de Aceite:
- Exibir ícone na bandeja do sistema (SystemTray) ao iniciar a aplicação
- Disparar notificações visuais (Toasts/Balões) para novos eventos e alertas
- Informar detalhes relevantes (Repo, Branch, Tipo de Evento) na notificação

---

### RF10 – Autenticação

O sistema deve permitir autenticação de usuários utilizando credenciais locais (E-mail/Senha) e Token JWT.

Critérios de Aceite:
- Realizar login retornando Token JWT válido
- Permitir cadastro de novos usuários (Register)
- Expirar sessão conforme validade do Token

---

### RF11 – Autorização

O sistema deve restringir o acesso aos dados com base nos repositórios autorizados para cada usuário.

Critérios de Aceite:
- Bloquear acesso a dados de repositórios não autorizados
- Registrar auditoria de acessos negados
- Aplicar autorização em todos os endpoints protegidos

---

### RF12 – Visualização de Diff de Código

O sistema deve permitir a visualização detalhada das alterações de código (diff) associadas a eventos de Push.

Critérios de Aceite:
- Exibir lista de arquivos alterados, adicionados ou removidos no commit
- Apresentar visualmente as diferenças (linhas adicionadas em verde, removidas em vermelho)
- Permitir navegação entre os arquivos do diff dentro da interface

---

### RF13 – Exportação de Relatórios

O sistema deve permitir a exportação consolidada dos dados do dashboard para formato de planilha (Excel/.xlsx).

Critérios de Aceite:
- Gerar arquivo .xlsx contendo múltiplas abas: Visão Geral, Repositórios, Eventos Recentes e Alertas
- Disponibilizar endpoint dedicado para geração do relatório
- Permitir o download do arquivo gerado pelo usuário

---

## 6. Requisitos Não Funcionais (RNF)

### RNF01 – Arquitetura

O sistema deve seguir arquitetura em camadas bem definidas, preparando terreno para futura adoção de:

- Arquitetura Hexagonal
    
- Comunicação baseada em eventos
    


### RNF02 – Escalabilidade

A aplicação deve suportar crescimento no volume de eventos recebidos.

Métricas:
- Suportar 200 eventos por minuto em regime normal
- Suportar picos de 500 eventos por minuto por até 15 minutos
- Recuperar backlog de eventos em até 10 minutos após indisponibilidade

---

### RNF03 – Segurança

- Uso de HTTPS
    
- Validação de Webhooks
    
- JWT para autenticação
    
- Proteção contra acesso não autorizado
    
Métricas:
- 100% dos Webhooks validados por assinatura HMAC
- TLS 1.2+ em todos os ambientes
- Tokens com expiração máxima de 60 minutos



### RNF04 – Observabilidade

- Logs estruturados
    
- Registro de eventos relevantes
    
- Tratamento centralizado de exceções
    
Métricas:
- Logs estruturados em JSON com correlação de requisições
- Retenção mínima de logs por 30 dias
- Métricas de latência, erros e throughput expostas



### RNF05 – Performance

- Uso de paginação nos endpoints
    
- Possibilidade futura de cache (ex: Redis)
    
Métricas:
- p95 de respostas em consultas abaixo de 300 ms
- p99 de respostas em consultas abaixo de 800 ms
- Processamento de Webhook confirmado em até 2 segundos

## 7. Requisitos Técnicos

### Stack Inicial (MVP)

- Java 21+
    
- Spring Boot
    
- Spring Web
    
- Spring Data JPA
    
- Spring Security
    
- JWT
    
- Banco de dados relacional (MySQL)
    


### Tecnologias Planejadas para Evolução

- Kafka ou RabbitMQ (event-driven)
    
- Arquitetura Hexagonal
    
- Cache distribuído
    
- Processamento assíncrono avançado
    

## 8. Integração com Webhooks

- Endpoint dedicado para recebimento de eventos do GitHub
- Validação obrigatória de assinatura HMAC com segredo por repositório
- Idempotência por delivery_id e descarte de duplicados
- Política de retries com backoff exponencial
- Rate limit por repositório para prevenir sobrecarga
- Política de reprocessamento manual de eventos falhos


## 9. Segurança e Conformidade

- Armazenamento de segredos em variáveis de ambiente ou cofre de segredos
- Auditoria de autenticação, autorização e alterações críticas
- Retenção de eventos e alertas por 12 meses
- Retenção de logs de auditoria por 90 dias


## 10. Modelo Conceitual de Domínio

### Entidades Principais

- Usuário (inclui matrícula e role)
- Repositório
- Evento
- Alerta (baseado em Regras Padrão)
- Notificação

### Relações Mínimas

- Usuário possui muitos Repositórios
- Repositório possui muitos Eventos
- Alerta referencia Repositório e Evento
- Notificação referencia Alerta


## 11. Endpoints Principais

- POST /auth/login
- POST /auth/register
- GET /repositories
- POST /repositories
- GET /events
- GET /metrics
- GET /alerts
- GET /alert-rules
- POST /alert-rules
- GET /notifications/stream


## 12. MVP – Entregas Iniciais

O MVP do projeto deverá conter:

1. Autenticação via credenciais locais (JWT)
    
2. Cadastro de repositórios
    
3. Recebimento e validação de Webhooks
    
4. Persistência de eventos
    
5. Consulta de histórico
    
6. Métricas básicas
    
7. Um conjunto inicial de regras de alerta
    

## 14. Evoluções Futuras Planejadas

- Integração com GitHub Actions
    
- Pipeline analytics
    
- Arquitetura Hexagonal completa
    
- Processamento de eventos via mensageria
    
