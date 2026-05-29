#!/bin/bash
set -e

COMPOSE="docker compose"

usage() {
  cat <<EOF
Usage: ./docker.sh <command>

Commands:
  start     Start all services in the background
  stop      Stop and remove all containers
  restart   Restart all services (no rebuild)
  rebuild   Rebuild images and restart — required after any of these changes:
              - backend/**  (Python code, requirements.txt, Dockerfile)
              - frontend/package.json, frontend/vite.config.ts, frontend/Dockerfile
              (frontend/src/** changes are picked up automatically via hot-reload)
  status    Show running containers and their health
  logs      Tail logs for all services (Ctrl+C to stop)
  logs <service>  Tail logs for a specific service: backend, frontend, postgres
EOF
}

case "$1" in
  start)
    echo "Starting DBA-Nexus..."
    $COMPOSE up -d
    echo ""
    echo "  Frontend : http://localhost:8080"
    echo "  Backend  : http://localhost:3000"
    echo "  Login    : admin / (your INITIAL_ADMIN_PASSWORD from .env)"
    ;;

  stop)
    echo "Stopping DBA-Nexus..."
    $COMPOSE down
    ;;

  restart)
    echo "Restarting all services (no rebuild)..."
    $COMPOSE restart
    ;;

  rebuild)
    echo "Rebuilding images and restarting..."
    $COMPOSE up --build -d
    echo ""
    echo "  Frontend : http://localhost:8080"
    echo "  Backend  : http://localhost:3000"
    ;;

  status)
    $COMPOSE ps
    ;;

  logs)
    if [ -n "$2" ]; then
      $COMPOSE logs -f "$2"
    else
      $COMPOSE logs -f
    fi
    ;;

  *)
    usage
    exit 1
    ;;
esac
