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
- **Banco de Dados:** [SQLite](https://www.sqlite.org/) com [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Autenticação:** Sistema customizado com JWT
- **Funcionalidades de IA:** [Google Gemini AI](https://ai.google.dev/) via [Genkit](https://firebase.google.com/docs/genkit)
- **Drag and Drop:** [dnd-kit](https://dndkit.com/)
- **Containerização:** [Docker](https://www.docker.com/) (opcional)

## ⚙️ Como Começar

Siga os passos abaixo para executar o projeto em seu ambiente local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 18.x ou superior)
- [Docker](https://www.docker.com/) (opcional, apenas para containerização)

### 1. Instalação

Clone o repositório e instale as dependências do projeto.

```bash
# Clone este repositório
git clone <URL_DO_REPOSITORIO>

# Navegue até o diretório do projeto
cd NextKanban

# Instale as dependências (o banco SQLite será inicializado automaticamente)
npm install
```

### 2. Configuração do Banco de Dados

O banco de dados SQLite é configurado automaticamente durante a instalação das dependências. O arquivo do banco será criado em `./data/nextkanban.db`.

#### Inicialização Manual (se necessário)

```bash
# Execute o script de inicialização do banco
npm run init-db
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# Chave da API do Google Gemini (obrigatória para IA)
GEMINI_API_KEY=sua-chave-do-gemini-aqui

# Configuração do SQLite
DB_PATH=./data/nextkanban.db

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

## 🐳 Docker (Opcional)

### Desenvolvimento Local

```bash
# Execute a aplicação localmente (recomendado)
npm run dev
```

### Produção com Docker

```bash
# Build da imagem
docker build -t nextkanban .

# Execute o container
docker run -d \
  --name nextkanban \
  -p 48321:48321 \
  -v $(pwd)/data:/app/data \
  -e NEXTAUTH_SECRET=seu-secret-aqui \
  -e JWT_SECRET=seu-jwt-secret-aqui \
  -e GEMINI_API_KEY=sua-chave-do-gemini \
  nextkanban
```

### Deploy com Volume Persistente

```bash
# Criar volume para dados
docker volume create nextkanban-data

# Executar com volume
docker run -d \
  --name nextkanban \
  -p 48321:48321 \
  -v nextkanban-data:/app/data \
  -e NEXTAUTH_SECRET=seu-secret-aqui \
  -e JWT_SECRET=seu-jwt-secret-aqui \
  -e GEMINI_API_KEY=sua-chave-do-gemini \
  nextkanban
```

## 🚀 Deploy

Para fazer o deploy desta aplicação:

1. **Vercel/Netlify:** Configure as variáveis de ambiente e faça upload do banco SQLite ou use um volume persistente
2. **Docker:** Use o Dockerfile incluído para containerização com volumes para persistência de dados
3. **VPS/Servidor:** Execute diretamente com Node.js, garantindo que o diretório `data` tenha permissões de escrita

Lembre-se de:
- Configurar todas as variáveis de ambiente na plataforma de sua escolha
- Garantir que o diretório de dados tenha permissões adequadas
- Fazer backup regular do arquivo `nextkanban.db`

## 🤖 Configuração da IA

Para usar as funcionalidades de IA:

1. Obtenha uma chave da API do Google Gemini em [Google AI Studio](https://aistudio.google.com/)
2. Configure a variável `GEMINI_API_KEY` no seu arquivo `.env`
3. A IA estará disponível no botão "Sugestão IA" nos quadros Kanban

## 📁 Estrutura do Banco de Dados

O SQLite cria automaticamente as seguintes tabelas:

- **users**: Gerenciamento de usuários e autenticação
- **tasks**: Tarefas do quadro Kanban
- **goals**: Metas de longo prazo
- **calendar_events**: Eventos do calendário semanal

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm start           # Inicia servidor de produção
npm run lint        # Executa linting
npm run typecheck   # Verifica tipos TypeScript

# Banco de dados
npm run init-db     # Inicializa/reinicializa o banco SQLite

# Docker
docker logs nextkanban              # Ver logs do container
docker exec -it nextkanban sh       # Acessar shell do container
docker cp nextkanban:/app/data/nextkanban.db ./backup.db  # Backup do banco
```

## 📝 Notas Importantes

- O arquivo do banco SQLite (`nextkanban.db`) contém todos os seus dados
- Faça backups regulares do arquivo de banco, especialmente antes de atualizações
- Em produção, certifique-se de que o diretório `data` tenha permissões adequadas
- Para desenvolvimento, o banco é criado automaticamente na primeira execução
