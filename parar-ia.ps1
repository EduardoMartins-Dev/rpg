# parar-ia.ps1 — encerra o tunel ngrok e descarrega o modelo da GPU (libera VRAM).
# O Ollama continua no ar em segundo plano (leve quando ocioso); so o modelo sai da memoria
# e o tunel fecha, entao o app na Vercel deixa de alcancar a IA local.
#
# Uso:  botao direito > "Executar com o PowerShell"
#   (ou:  powershell -ExecutionPolicy Bypass -File .\parar-ia.ps1 )

$ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$model  = "qwen2.5:14b-instruct-q4_K_M"

Write-Host "[1/2] Encerrando tunel ngrok..." -ForegroundColor Cyan
$ng = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ng) { $ng | Stop-Process -Force; Write-Host "      tunel encerrado." } else { Write-Host "      nenhum tunel rodando." }

Write-Host "[2/2] Descarregando $model da GPU..." -ForegroundColor Cyan
if (Test-Path $ollama) { try { & $ollama stop $model 2>$null | Out-Null; Write-Host "      modelo liberado da VRAM." } catch { Write-Host "      (modelo ja estava descarregado)" } }

Write-Host ""
Write-Host "IA parada. Para voltar a jogar, rode iniciar-ia.ps1." -ForegroundColor Green
