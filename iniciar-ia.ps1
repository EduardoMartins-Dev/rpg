# iniciar-ia.ps1 — sobe o Ollama (se preciso), pre-carrega o Qwen na GPU e abre o tunel
# ngrok na URL FIXA. Deixe ESTA JANELA ABERTA durante o jogo.
#
# URL fixa (ja configurada no Vercel em OLLAMA_BASE_URL — nao muda nunca):
#   https://flashback-nutmeg-fencing.ngrok-free.dev
#
# Uso:  botao direito no arquivo > "Executar com o PowerShell"
#   (ou:  powershell -ExecutionPolicy Bypass -File .\iniciar-ia.ps1 )

$ErrorActionPreference = "Stop"
$ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$ngrok  = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
$model  = "qwen2.5:14b-instruct-q4_K_M"
$domain = "https://flashback-nutmeg-fencing.ngrok-free.dev"

if (-not (Test-Path $ollama)) { Write-Host "Ollama nao encontrado." -ForegroundColor Red; exit 1 }
if (-not (Test-Path $ngrok))  { $ngrok = (Get-Command ngrok -ErrorAction SilentlyContinue).Source }
if (-not $ngrok -or -not (Test-Path $ngrok)) { Write-Host "ngrok nao encontrado." -ForegroundColor Red; exit 1 }

# 1) Ollama no ar?
Write-Host "[1/3] Verificando Ollama..." -ForegroundColor Cyan
try { Invoke-WebRequest "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null }
catch { Write-Host "      subindo Ollama..."; Start-Process $ollama -ArgumentList "serve" -WindowStyle Hidden; Start-Sleep 5 }

# 2) Pre-carrega o modelo na VRAM (1a resposta fica rapida)
Write-Host "[2/3] Carregando $model na GPU..." -ForegroundColor Cyan
& $ollama run $model "responda apenas: ok" | Out-Null

# 3) Tunel ngrok na URL FIXA. --host-header e OBRIGATORIO (senao o Ollama devolve 403).
Write-Host "[3/3] Abrindo tunel ngrok em: $domain" -ForegroundColor Green
Write-Host "      (essa URL ja esta no Vercel; nao precisa mexer em nada la)" -ForegroundColor Green
Write-Host "      Mantenha esta janela aberta enquanto joga. Ctrl+C encerra." -ForegroundColor Yellow
Write-Host ""
& $ngrok http 11434 --url=$domain --host-header=localhost:11434
