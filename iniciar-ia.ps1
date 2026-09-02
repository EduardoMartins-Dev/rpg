# iniciar-ia.ps1 - sobe o Ollama (se preciso), pre-carrega o Qwen na GPU e abre o tunel
# ngrok na URL FIXA. O script SE VERIFICA: so diz "IA PRONTA" depois que a URL publica
# responde de verdade. Deixe ESTA JANELA ABERTA durante o jogo.
#
# URL fixa (ja configurada no Vercel em OLLAMA_BASE_URL - nao muda nunca):
#   https://flashback-nutmeg-fencing.ngrok-free.dev
#
# Uso:  botao direito no arquivo > "Executar com o PowerShell"
#   (ou:  powershell -ExecutionPolicy Bypass -File .\iniciar-ia.ps1 )

$ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$ngrok  = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
$model  = "qwen2.5:14b-instruct-q4_K_M"
$domain = "https://flashback-nutmeg-fencing.ngrok-free.dev"
$log    = Join-Path $env:TEMP "ngrok-mesa-arcana.log"

function Info($m){ Write-Host $m -ForegroundColor Cyan }
function Ok($m){ Write-Host $m -ForegroundColor Green }
function Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Err($m){ Write-Host $m -ForegroundColor Red }

# Corpo minimo para acordar/testar o modelo (num_ctx e OBRIGATORIO ou o prompt trunca).
function ChatBody($txt){ @{ model=$model; messages=@(@{role="user";content=$txt}); stream=$false; options=@{ num_ctx=16384 } } | ConvertTo-Json -Depth 5 }

if (-not (Test-Path $ollama)) { Err "Ollama nao encontrado em $ollama"; Read-Host "Enter para sair"; exit 1 }
if (-not (Test-Path $ngrok))  { $c=(Get-Command ngrok -ErrorAction SilentlyContinue).Source; if($c){$ngrok=$c} else { Err "ngrok nao encontrado"; Read-Host "Enter para sair"; exit 1 } }

# 1) Ollama no ar?
Info "[1/4] Verificando Ollama..."
$up=$false; try { Invoke-WebRequest "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null; $up=$true } catch {}
if (-not $up) { Info "      subindo Ollama..."; Start-Process $ollama -ArgumentList "serve" -WindowStyle Hidden; Start-Sleep 5 }

# 2) Pre-carrega o modelo na VRAM (nao-fatal: se falhar, segue e testa de novo no passo 4)
Info "[2/4] Carregando $model na GPU (pode levar ~30s na 1a vez)..."
try { Invoke-RestMethod "http://localhost:11434/api/chat" -Method Post -Body (ChatBody "responda apenas: ok") -ContentType "application/json" -TimeoutSec 180 | Out-Null; Ok "      modelo pronto." }
catch { Warn "      aviso: nao pre-carregou agora ($($_.Exception.Message)); segue assim mesmo." }

# 3) Fecha tunel local anterior (plano free = 1 sessao) e abre o novo em segundo plano
Info "[3/4] Abrindo tunel ngrok em $domain ..."
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
$ng = Start-Process $ngrok -ArgumentList "http","11434","--url=$domain","--host-header=localhost:11434","--log=stdout","--log-level=info" -RedirectStandardOutput $log -WindowStyle Hidden -PassThru

# 4) Confirma prontidao PELA URL PUBLICA (o que a Vercel enxerga)
Info "[4/4] Confirmando a URL publica (ate ~40s)..."
$ready=$false
for ($i=0; $i -lt 20; $i++) {
  Start-Sleep 2
  if ($ng.HasExited) { Err "      ngrok encerrou sozinho (exit $($ng.ExitCode))."; break }
  try { Invoke-RestMethod "$domain/api/chat" -Method Post -Body (ChatBody "ok") -ContentType "application/json" -Headers @{ "ngrok-skip-browser-warning"="1" } -TimeoutSec 30 | Out-Null; $ready=$true; break } catch {}
}

Write-Host ""
if ($ready) {
  Ok  "=================================================="
  Ok  "  IA PRONTA - a Mesa Arcana ja alcanca sua maquina"
  Ok  "  URL: $domain"
  Ok  "=================================================="
  Warn "NAO FECHE esta janela enquanto estiver jogando."
  Warn "Para parar: feche a janela ou rode parar-ia.ps1."
  Wait-Process -Id $ng.Id   # segura a janela enquanto o tunel viver
} else {
  Err "A IA NAO subiu: o Ollama esta ok, mas a URL publica nao respondeu."
  Err "Ultimas linhas do ngrok (o motivo costuma estar aqui):"
  Get-Content $log -Tail 20 -ErrorAction SilentlyContinue
  Warn "Dicas: (1) se aparecer 'ERR_NGROK_108/limited to 1 session', ha outro ngrok/sessao aberta - feche e rode de novo;"
  Warn "       (2) se falar de authtoken, rode:  ngrok config add-authtoken <SEU_TOKEN_NOVO>"
  if (-not $ng.HasExited) { Stop-Process -Id $ng.Id -Force -ErrorAction SilentlyContinue }
  Read-Host "`nEnter para sair"
}
