# NextKanban - Seu Quadro Kanban com Tecnologia de IA

Bem-vindo ao NextKanban! Esta é uma aplicação web completa construída para ajudá-lo a organizar suas tarefas, gerenciar suas metas e planejar sua semana de forma eficiente, tudo em um só lugar e com o poder da inteligência artificial.

## ✨ Funcionalidades Principais

- **Quadros Kanban Duplos:** Organize suas atividades diárias e suas metas de longo prazo em quadros separados.
  - **Quadro de Tarefas:** 'Não Iniciado', 'A Fazer', 'Fazendo' e 'Feito'.
  - **Quadro de Metas:** 'Semanal', 'Mensal', 'Trimestral' e 'Anual'.
- **Arrastar e Soltar (Drag-and-Drop):** Mova tarefas e metas entre as colunas de forma fluida e intuitiva.
- **Gerenciamento Completo de Tarefas (CRUD):** Crie, edite e exclua tarefas e metas diretamente na interface.
- **Sugestão Inteligente por IA:** Descreva qualquer atividade e deixe que a IA decida automaticamente o melhor quadro, seja para tarefas ou metas.
- **Calendário Semanal Integrado:** Adicione, edite e visualize seus compromissos da semana em uma interface de calendário dedicada.
- **Autenticação Segura:** Sistema de login e cadastro com isolamento completo de dados por usuário.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com um conjunto de tecnologias modernas e performáticas:

- **Framework:** [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Autenticação:** Sistema customizado com JWT
- **Funcionalidades de IA:** [Google Gemini AI](https://ai.google.dev/) via [Genkit](https://firebase.google.com/docs/genkit)
- **Drag and Drop:** [dnd-kit](https://dndkit.com/)
- **Containerização:** [Docker](https://www.docker.com/)

## ⚙️ Como Começar

Siga os passos abaixo para executar o projeto em seu ambiente local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior)
- [Docker](https://www.docker.com/) e Docker Compose
- [PostgreSQL](https://www.postgresql.org/) (ou use Docker)

### 1. Instalação

Clone o repositório e instale as dependências do projeto.

```bash
# Clone este repositório
git clone <URL_DO_REPOSITORIO>

# Navegue até o diretório do projeto
cd NextKanban

# Instale as dependências
npm install
```

### 2. Configuração do Banco de Dados

#### Opção A: Usando Docker (Recomendado)

```bash
# Inicie o PostgreSQL com Docker
docker-compose -f docker-compose.postgres.yml up -d
```

#### Opção B: PostgreSQL Local

1. Instale o PostgreSQL em sua máquina
2. Execute o script de configuração:
   - **Windows:** `./setup_postgres.ps1`
   - **Linux/Mac:** Execute os comandos do arquivo `setup_postgres.sql`

### 3. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# Chave da API do Google Gemini (obrigatória para IA)
GEMINI_API_KEY=sua-chave-do-gemini-aqui

# Configuração do PostgreSQL
DATABASE_URL=postgresql://nextkanban_user:nextkanban_password@localhost:5432/nextkanban

# Secrets de autenticação (gere strings aleatórias de 32+ caracteres)
NEXTAUTH_SECRET=seu-secret-aqui
JWT_SECRET=seu-jwt-secret-aqui
```

### 4. Executando a Aplicação

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:48321](http://localhost:48321) em seu navegador para ver a aplicação em funcionamento.

### 5. Primeiro Acesso

1. Acesse a página de cadastro em `/signup`
2. Crie sua conta com nome de usuário e senha
3. Faça login e comece a usar o sistema!

## 🐳 Docker

### Desenvolvimento com Docker

```bash
# Inicie apenas o PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Execute a aplicação localmente
npm run dev
```

### Produção com Docker

```bash
# Build da imagem
docker build -t nextkanban .

# Execute com docker-compose (inclui PostgreSQL)
docker-compose up -d
```

## 🚀 Deploy

Para fazer o deploy desta aplicação:

1. **Vercel/Netlify:** Configure as variáveis de ambiente e conecte um banco PostgreSQL
2. **Docker:** Use o Dockerfile incluído para containerização
3. **Firebase App Hosting:** Configure o `apphosting.yaml` incluído

Lembre-se de configurar todas as variáveis de ambiente na plataforma de sua escolha.

## 🤖 Configuração da IA

Para usar as funcionalidades de IA:

1. Obtenha uma chave da API do Google Gemini em [Google AI Studio](https://aistudio.google.com/)
2. Configure a variável `GEMINI_API_KEY` no seu arquivo `.env`
3. A IA estará disponível no botão "Sugestão IA" nos quadros Kanban
