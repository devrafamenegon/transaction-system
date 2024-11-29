# Sistema de Transações Bancárias

Um sistema robusto de transações bancárias construído com NestJS, apresentando processamento concorrente de transações, operações baseadas em fila e medidas abrangentes de segurança.

## Funcionalidades

### Funcionalidades Bancárias Principais

- Gerenciamento de Contas (criar, visualizar, gerenciar saldos)
- Processamento de Transações (depósitos, saques, transferências)
- Suporte a Contas Multi-usuário
- Histórico de Transações e Logs de Auditoria

### Funcionalidades Técnicas

- Processamento de Transações baseado em Fila com Bull
- Tratamento de Transações Concorrentes
- Bloqueio Otimista e Pessimista
- Mecanismo Automático de Retentativa de Transações
- Tratamento Abrangente de Erros
- Registro Detalhado de Transações

### Funcionalidades de Segurança

- Autenticação baseada em JWT
- Controle de Acesso baseado em Funções (Usuário/Admin)
- Criptografia de Senha
- Limitação de Taxa de Requisições
- Validação de Dados
- Proteção contra Injeção SQL

## Stack Tecnológica

- **Framework**: NestJS
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL com TypeORM
- **Sistema de Fila**: Bull (baseado em Redis)
- **Autenticação**: JWT com Passport
- **Testes**: Jest & Supertest
- **Documentação**: Swagger/OpenAPI
- **Containerização**: Docker & Docker Compose

## Pré-requisitos

- Node.js (v14 ou superior)
- Docker e Docker Compose
- PostgreSQL
- Redis

## Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd banking-system
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Inicie os serviços necessários:

```bash
docker-compose up -d
```

5. Inicie a aplicação:

```bash
npm run start:dev
```

## Configuração de Ambiente

A aplicação utiliza diferentes arquivos de ambiente para diferentes ambientes:

- `.env` - Ambiente de desenvolvimento
- `.env.test` - Ambiente de testes

Variáveis de ambiente principais:

```env
# Aplicação
PORT=3000
NODE_ENV=development

# Banco de Dados
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=bank_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h

# Configuração de Transações
TRANSACTION_MAX_RETRIES=5
TRANSACTION_INITIAL_RETRY_DELAY=50
```

## Documentação da API

A documentação da API está disponível via Swagger UI em `/docs` quando a aplicação está em execução.

### Endpoints Principais

#### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário

#### Contas

- `POST /api/accounts` - Criar nova conta
- `GET /api/accounts/:accountNumber` - Obter detalhes da conta (Admin)
- `GET /api/accounts/user/accounts` - Obter contas do usuário

#### Transações

- `POST /api/transactions` - Criar transação
- `GET /api/transactions/status/:jobId` - Verificar status da transação
- `GET /api/transactions` - Obter todas as transações (Admin)

#### Logs de Transações

- `GET /api/transaction-logs` - Consultar logs de transações (Admin)
- `GET /api/transaction-logs/by-account` - Obter logs por conta (Admin)

## Testes

### Testes Unitários

```bash
npm run test
```

### Testes E2E

```bash
npm run test:e2e
```

### Cobertura de Testes

```bash
npm run test:cov
```

## Arquitetura

### Esquema do Banco de Dados

#### Tabela Users

- id (UUID)
- email (único)
- password (hash)
- role (user/admin)
- created_at
- updated_at

#### Tabela Accounts

- id (UUID)
- account_number (único)
- balance
- is_shared_account
- version (para bloqueio otimista)
- created_at
- updated_at

#### Tabela Transactions

- id (UUID)
- source_account_id
- destination_account_id (opcional)
- amount
- type (deposit/withdrawal/transfer)
- created_at
- description

#### Tabela Transaction Logs

- id (UUID)
- transaction_id
- account_id
- previous_balance
- new_balance
- status
- error_message (opcional)
- metadata
- created_at

### Sistema de Fila

A aplicação utiliza a fila Bull para manipular transações:

- Processamento assíncrono
- Retentativas automáticas com backoff exponencial
- Fila de mensagens mortas para transações falhas
- Rastreamento de status de transação em tempo real

### Medidas de Segurança

1. **Autenticação & Autorização**

   - Autenticação baseada em JWT
   - Controle de acesso baseado em funções
   - Validação de requisições

2. **Proteção de Dados**

   - Hash de senhas
   - Criptografia de dados sensíveis
   - Sanitização de entrada

3. **Segurança de Transações**
   - Bloqueio pessimista para atualizações de saldo
   - Isolamento de transações
   - Rollback automático em caso de falha
