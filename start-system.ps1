#!/usr/bin/env pwsh
# Script para inicializar o sistema NextKanban completo

Write-Host "🚀 Iniciando NextKanban System..." -ForegroundColor Green

# Verificar se Docker está rodando
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Parar containers existentes se estiverem rodando
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Construir e iniciar os serviços
Write-Host "🔨 Construindo e iniciando serviços..." -ForegroundColor Yellow
docker-compose up --build -d

# Aguardar o PostgreSQL ficar pronto
Write-Host "⏳ Aguardando PostgreSQL ficar pronto..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status dos containers
Write-Host "📊 Status dos containers:" -ForegroundColor Yellow
docker-compose ps

# Mostrar logs se houver erro
$postgresStatus = docker-compose ps postgres --format "{{.State}}"
$appStatus = docker-compose ps nextkanban --format "{{.State}}"

if ($postgresStatus -ne "running") {
    Write-Host "❌ PostgreSQL não está rodando. Logs:" -ForegroundColor Red
    docker-compose logs postgres
}

if ($appStatus -ne "running") {
    Write-Host "❌ NextKanban app não está rodando. Logs:" -ForegroundColor Red
    docker-compose logs nextkanban
}

if ($postgresStatus -eq "running" -and $appStatus -eq "running") {
    Write-Host "" 
    Write-Host "🎉 Sistema iniciado com sucesso!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "📱 Aplicação disponível em: http://localhost:48321" -ForegroundColor Cyan
    Write-Host "🗄️  PostgreSQL disponível em: localhost:5432" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "📋 Comandos úteis:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f          # Ver logs em tempo real" -ForegroundColor White
    Write-Host "   docker-compose down             # Parar sistema" -ForegroundColor White
    Write-Host "   docker-compose restart          # Reiniciar sistema" -ForegroundColor White
    Write-Host "   docker-compose exec postgres psql -U nextkanban_user -d nextkanban  # Acessar banco" -ForegroundColor White
} else {
    Write-Host "" 
    Write-Host "❌ Erro ao iniciar o sistema. Verifique os logs acima." -ForegroundColor Red
    exit 1
}