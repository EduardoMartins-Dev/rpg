#!/usr/bin/env bash
# F6 — UI E2E ponta a ponta (Playwright) contra back+front reais.
# Sobe: pgvector (podman) -> backend Spring Boot (perfil dev, seed §8) -> Playwright
# (que sobe o frontend). Tudo derrubado ao final. Usage: scripts/e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/env.sh"

cleanup() {
  [ -n "${BACK_PID:-}" ] && kill "$BACK_PID" 2>/dev/null || true
  "$ROOT/scripts/db.sh" down 2>/dev/null || true
}
trap cleanup EXIT

echo "== 1/4 banco (pgvector) =="
"$ROOT/scripts/db.sh" up

echo "== 2/4 backend (perfil dev) =="
( cd "$ROOT/backend" && SPRING_PROFILES_ACTIVE=dev ./mvnw -q -B spring-boot:run ) \
  > /tmp/portalrpg-backend.log 2>&1 &
BACK_PID=$!

echo "aguardando backend em :8080 ..."
for _ in $(seq 1 90); do
  if curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "backend UP"; break
  fi
  sleep 2
done
curl -sf http://localhost:8080/actuator/health >/dev/null || { echo "backend não subiu; veja /tmp/portalrpg-backend.log" >&2; exit 1; }

echo "== 3/4 navegador Playwright =="
( cd "$ROOT/frontend" && npx playwright install chromium )

echo "== 4/4 testes E2E de UI =="
( cd "$ROOT/frontend" && npm run test:e2e )
