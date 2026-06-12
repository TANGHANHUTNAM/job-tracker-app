#!/usr/bin/env bash
# ============================================================
# deploy.sh — Server-side deploy script
# Called by GitHub Actions via SSH
# ============================================================
set -Eeuo pipefail

# --- Configuration ---
APP_NAME="job-app-tracker"
APP_DIR="/opt/${APP_NAME}"
COMPOSE_FILE="${APP_DIR}/deploy/docker/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env.production"
HEALTH_URL="http://127.0.0.1:3000/api/health"
MAX_WAIT=120

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Cleanup on failure ---
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deploy failed with exit code $exit_code"
        log_warn "Rolling back to previous image..."
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" up -d --no-deps app 2>/dev/null || true
    fi
}
trap cleanup EXIT

# --- Main ---
main() {
    local commit_sha="${1:-unknown}"
    log_info "Starting deploy for commit: ${commit_sha:0:7}"

    # Ensure .env.production exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error ".env.production not found at $ENV_FILE"
        log_error "Create it from .env.production.example on the server"
        exit 1
    fi

    cd "$APP_DIR"

    # Pull latest code
    log_info "Pulling latest code..."
    git fetch origin main
    git reset --hard origin/main
    git clean -fd

    # Save current image digest for rollback
    local old_digest
    old_digest=$(docker inspect --format='{{.Image}}' "$APP_NAME" 2>/dev/null || echo "none")
    log_info "Current image: ${old_digest:0:19}"

    # Build new image
    log_info "Building new Docker image..."
    docker compose -f "$COMPOSE_FILE" build --no-cache app

    # Stop old container and start new one
    log_info "Deploying new container..."
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-deps app

    # Health check
    log_info "Waiting for health check (max ${MAX_WAIT}s)..."
    local elapsed=0
    while [[ $elapsed -lt $MAX_WAIT ]]; do
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            log_info "Health check passed after ${elapsed}s"
            log_info "Deploy complete! Container is healthy."
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done

    echo ""
    log_error "Health check failed after ${MAX_WAIT}s"
    log_error "Checking container logs..."
    docker logs "$APP_NAME" --tail 30

    exit 1
}

main "$@"
