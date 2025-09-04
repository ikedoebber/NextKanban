# Script PowerShell para configurar PostgreSQL no Windows
# Execute este script como Administrador

Write-Host "Configurando PostgreSQL..." -ForegroundColor Green

# Verificar se o PostgreSQL está instalado
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "PostgreSQL não encontrado. Instalando via Chocolatey..." -ForegroundColor Yellow
    
    # Verificar se Chocolatey está instalado
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoPath) {
        Write-Host "Instalando Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Instalar PostgreSQL
    choco install postgresql --params '/Password:password' -y
    
    # Adicionar PostgreSQL ao PATH
    $env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
    [Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)
}

# Aguardar o serviço PostgreSQL iniciar
Write-Host "Aguardando serviço PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Executar script SQL
Write-Host "Executando configuração do banco..." -ForegroundColor Yellow
try {
    # Tentar conectar como postgres
    $env:PGPASSWORD = "password"
    psql -U postgres -d postgres -f "setup_postgres.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL configurado com sucesso!" -ForegroundColor Green
    } else {
        # Se falhar, tentar como usuário padrão do sistema
        Write-Host "Tentando configuração alternativa..." -ForegroundColor Yellow
        psql -d postgres -f "setup_postgres.sql"
    }
} catch {
    Write-Host "Erro na configuração: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tente executar manualmente: psql -U postgres -d postgres -f setup_postgres.sql" -ForegroundColor Yellow
}

Write-Host "Configuração concluída. Reinicie o terminal para aplicar as mudanças no PATH." -ForegroundColor Green