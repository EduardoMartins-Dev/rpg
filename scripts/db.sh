#!/usr/bin/env bash
# Dev DB without any compose tool — plain podman. Usage: scripts/db.sh up|down|logs
set -euo pipefail
NAME=portalrpg-db
IMG=pgvector/pgvector:pg16

case "${1:-up}" in
  up)
    podman run -d --name "$NAME" \
      -e POSTGRES_DB=portalrpg -e POSTGRES_USER=portalrpg -e POSTGRES_PASSWORD=portalrpg \
      -p 5432:5432 -v portalrpg-pgdata:/var/lib/postgresql/data "$IMG"
    echo "waiting for db..."
    for _ in $(seq 1 25); do
      podman exec "$NAME" pg_isready -U portalrpg -d portalrpg >/dev/null 2>&1 && { echo "db ready on :5432"; exit 0; }
      sleep 2
    done
    echo "db did not become ready" >&2; exit 1 ;;
  down)  podman rm -f "$NAME" ;;
  logs)  podman logs -f "$NAME" ;;
  *) echo "usage: $0 up|down|logs" >&2; exit 2 ;;
esac
