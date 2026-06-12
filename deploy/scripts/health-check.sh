#!/usr/bin/env bash
# ============================================================
# health-check.sh — Quick container health check
# Usage: ./health-check.sh [url]
# ============================================================
set -Eeuo pipefail

URL="${1:-http://127.0.0.1:3000/api/health}"
TIMEOUT=5

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

response=$(curl -sf --max-time "$TIMEOUT" "$URL" 2>/dev/null) || {
    echo -e "${RED}UNHEALTHY${NC} — $URL"
    exit 1
}

echo -e "${GREEN}HEALTHY${NC} — $response"
exit 0
