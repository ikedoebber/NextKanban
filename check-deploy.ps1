# Script para verificar arquivos necessários para deploy

Write-Host "🔍 Verificando arquivos necessários para deploy..." -ForegroundColor Yellow
Write-Host ""

# Verificar Dockerfile
if (Test-Path "Dockerfile") {
    Write-Host "✅ Dockerfile" -ForegroundColor Green
} else {
    Write-Host "❌ Dockerfile" -ForegroundColor Red
}

# Verificar docker-compose.yml
if (Test-Path "docker-compose.yml") {
    Write-Host "✅ docker-compose.yml" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml" -ForegroundColor Red
}

# Verificar package.json
if (Test-Path "package.json") {
    Write-Host "✅ package.json" -ForegroundColor Green
} else {
    Write-Host "❌ package.json" -ForegroundColor Red
}

# Verificar se Dockerfile está no Git
$dockerfileInGit = git ls-files | Select-String "^Dockerfile$"
if ($dockerfileInGit) {
    Write-Host "✅ Dockerfile está no Git" -ForegroundColor Green
} else {
    Write-Host "❌ Dockerfile NÃO está no Git" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Para fazer deploy:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Fix deploy files'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White