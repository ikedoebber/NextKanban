# ===============================
# Base image
# ===============================
FROM node:20.11.1-alpine3.19

# ===============================
# Diretório de trabalho
# ===============================
WORKDIR /app

# ===============================
# Copia apenas package.json e package-lock.json
# para instalar dependências primeiro (cache do Docker)
# ===============================
COPY package.json package-lock.json* ./

# ===============================
# Instala todas as dependências (dev + prod)
# sem rodar scripts ainda
# ===============================
RUN npm install --ignore-scripts

# ===============================
# Copia todo o código do projeto
# ===============================
COPY . .

# ===============================
# Roda scripts que dependem do código
# ===============================
RUN npm run init-db

# ===============================
# Rebuild do better-sqlite3 no container
# ===============================
RUN npm rebuild better-sqlite3 --build-from-source

# ===============================
# Build do Next.js
# ===============================
RUN npm run build

# ===============================
# Porta que o container vai expor
# ===============================
EXPOSE 48321

# ===============================
# Comando padrão
# ===============================
CMD ["npm", "start"]
