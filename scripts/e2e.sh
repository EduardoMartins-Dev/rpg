#!/usr/bin/env bash
# F6 — UI E2E ponta a ponta (Playwright) contra o app Next.js (API + front no mesmo
# processo desde a migração pra Route Handlers — sem backend Java separado).
# Sobe: Postgres/pgvector (docker) -> seed dev -> build de produção -> Playwright
# (que sobe via `next start`). Rodar contra `next dev` foi descartado: o Turbopack
# recompila sob demanda a cada rota tocada pela primeira vez, e isso remonta
# componentes NO MEIO da interação do teste (perde estado, solta refs do DOM) —
# parecia bug de app, mas era só o dev server frio.
# Tudo derrubado ao final. Usage: scripts/e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() {
  (cd "$ROOT" && docker compose down 2>/dev/null) || true
}
trap cleanup EXIT

echo "== 1/5 banco (pgvector) =="
(cd "$ROOT" && docker compose up -d)

echo "== 2/5 seed dev (contas fixas §8) =="
(cd "$ROOT/frontend" && npm run db:seed)

echo "== 3/5 build de produção =="
(cd "$ROOT/frontend" && npm run build)

echo "== 4/5 navegador Playwright =="
(cd "$ROOT/frontend" && npx playwright install chromium)

echo "== 5/5 testes E2E de UI =="
(cd "$ROOT/frontend" && npm run test:e2e)
