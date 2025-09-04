#!/bin/bash
# Script para garantir que o Dockerfile esteja disponível no contexto correto

echo "🔍 Verificando Dockerfile..."

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile encontrado"
    echo "📄 Primeiras linhas do Dockerfile:"
    head -5 Dockerfile
else
    echo "❌ Dockerfile não encontrado!"
    echo "📁 Arquivos no diretório atual:"
    ls -la
    exit 1
fi

echo "🎯 Dockerfile está pronto para build!"