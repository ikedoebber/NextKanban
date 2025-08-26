# DfDKanban - Seu Quadro Kanban com Tecnologia de IA

Bem-vindo ao DfDKanban! Esta é uma aplicação web completa construída para ajudá-lo a organizar suas tarefas, gerenciar suas metas e planejar sua semana de forma eficiente, tudo em um só lugar e com o poder da inteligência artificial.

## ✨ Funcionalidades Principais

- **Quadros Kanban Duplos:** Organize suas atividades diárias e suas metas de longo prazo em quadros separados.
  - **Quadro de Tarefas:** 'Não Iniciado', 'A Fazer', 'Fazendo' e 'Feito'.
  - **Quadro de Metas:** 'Semanal', 'Mensal', 'Trimestral' e 'Anual'.
- **Arrastar e Soltar (Drag-and-Drop):** Mova tarefas e metas entre as colunas de forma fluida e intuitiva.
- **Gerenciamento Completo de Tarefas (CRUD):** Crie, edite e exclua tarefas e metas diretamente na interface.
- **Sugestão por IA:** Descreva uma tarefa ou meta e deixe que a inteligência artificial sugira em qual quadro ela se encaixa melhor, otimizando seu fluxo de trabalho.
- **Calendário Semanal Integrado:** Adicione, edite e visualize seus compromissos da semana em uma interface de calendário dedicada.
- **Autenticação de Usuário:** Sistema seguro de login e cadastro para garantir que seus dados sejam acessíveis apenas por você.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com um conjunto de tecnologias modernas e performáticas:

- **Framework:** [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Backend e Banco de Dados:** [Firebase](https://firebase.google.com/) (Firestore para banco de dados e Authentication para usuários)
- **Funcionalidades de IA:** [Google AI Studio (Genkit)](https://ai.google.dev/genkit)
- **Drag and Drop:** [dnd-kit](https://dndkit.com/)

## ⚙️ Como Começar

Siga os passos abaixo para executar o projeto em seu ambiente local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior)
- `npm` ou `yarn`

### 1. Instalação

Clone o repositório e instale as dependências do projeto.

```bash
# Clone este repositório
git clone <URL_DO_REPOSITORIO>

# Navegue até o diretório do projeto
cd next-kanban

# Instale as dependências
npm install
```

### 2. Variáveis de Ambiente

Para que a aplicação se conecte ao Firebase, você precisa fornecer a chave de API.

- Crie um arquivo chamado `.env` na raiz do projeto.
- Adicione a seguinte linha a ele, substituindo `SUA_CHAVE_DE_API_DO_FIREBASE` pela chave fornecida:

```
NEXT_PUBLIC_FIREBASE_API_KEY=SUA_CHAVE_DE_API_DO_FIREBASE
```

### 3. Executando a Aplicação

Com tudo configurado, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:9002](http://localhost:9002) em seu navegador para ver a aplicação em funcionamento.

## ☁️ Deploy

Para fazer o deploy desta aplicação, você pode utilizar plataformas como [Vercel](https://vercel.com/) (altamente recomendado para projetos Next.js) ou [Firebase App Hosting](https://firebase.google.com/docs/hosting). Lembre-se de configurar as variáveis de ambiente na plataforma de sua escolha.
