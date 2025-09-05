# ===============================
# Base image
# ===============================
FROM node:20.11.1-alpine3.19

# Instala ferramentas para compilar pacotes nativos
RUN apk add --no-cache python3 g++ make

# ===============================
# Diretório de trabalho
# ===============================
WORKDIR /app

# ===============================
# Copia apenas package.json e package-lock.json
# ===============================
COPY package.json package-lock.json* ./

# ===============================
# Instala todas as dependências (dev + prod)
# sem rodar scripts ainda
# ===============================
RUN npm install --ignore-scripts

# ===============================
# Copia o restante do código
# ===============================
COPY . .

# ===============================
# Rebuild do better-sqlite3 antes de usar
# ===============================
RUN npm rebuild better-sqlite3 --build-from-source

# ===============================
# Inicializa o banco de dados
# ===============================
RUN npm run init-db

# ===============================
# Build do Next.js
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
