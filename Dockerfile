# ===============================
# Base image
# ===============================
FROM node:20.11.1-slim

# Instala ferramentas necessárias
RUN apt-get update && apt-get install -y \
    python3 \
    g++ \
    make \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# ===============================
# Diretório de trabalho
# ===============================
WORKDIR /app

# ===============================
# Copia package.json e package-lock.json
# ===============================
COPY package.json package-lock.json* ./

# ===============================
# Instala todas as dependências sem rodar scripts
# ===============================
RUN npm install --ignore-scripts

# ===============================
# Copia o restante do código
# ===============================
COPY . .

# ===============================
# Rebuild better-sqlite3
# ===============================
RUN npm rebuild better-sqlite3 --build-from-source

# ===============================
# Inicializa o banco de dados
# ===============================
RUN npm run init-db

# ===============================
# Build Next.js
# ===============================
RUN npm run build

# ===============================
# Porta do container
# ===============================
EXPOSE 48321

# ===============================
# Comando padrão
# ===============================
CMD ["npm", "start"]
