#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  findit – Start All Services (tmux tabs)
# ─────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT/findit-api"
MOBILE_DIR="$ROOT/findit-mobile"
MOBILE_ENV="$MOBILE_DIR/.env"
API_PORT="${API_PORT:-3000}"
SESSION="findit"

# ── 1. Detect local IP ────────────────────────
get_ip() {
  if command -v ip &>/dev/null; then
    ip route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}'
  fi
}

IP="$(get_ip)"
if [[ -z "$IP" ]] && command -v hostname &>/dev/null; then
  IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [[ -z "$IP" ]]; then
  echo "❌  Could not detect local IP address. Aborting."
  exit 1
fi
echo "✅  Detected IP: $IP"

# ── 2. Update mobile .env ─────────────────────
mkdir -p "$MOBILE_DIR"
if [[ ! -f "$MOBILE_ENV" ]]; then
  echo "EXPO_PUBLIC_API_URL=\"http://${IP}:${API_PORT}\"" >"$MOBILE_ENV"
  echo "✅  Created $MOBILE_ENV"
else
  sed -i.bak -E "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=\"http://${IP}:${API_PORT}\"|" "$MOBILE_ENV"
  echo "✅  Updated EXPO_PUBLIC_API_URL → http://${IP}:${API_PORT}"
fi

# ── 3. Preflight checks ───────────────────────
for dir in "$API_DIR" "$MOBILE_DIR"; do
  if [[ ! -d "$dir" ]]; then
    echo "❌  Missing directory: $dir"
    exit 1
  fi
done

if [[ ! -f "$API_DIR/.env" ]]; then
  echo "❌  API .env not found. Copy and edit: $API_DIR/.env"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "❌  docker not found."
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "❌  Docker daemon is not running."
  exit 1
fi

if ! command -v tmux &>/dev/null; then
  echo "❌  tmux not found. Install it: sudo dnf install tmux"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "❌  node not found."
  exit 1
fi

# ── 4. Install deps if needed ─────────────────
if [[ ! -d "$API_DIR/node_modules" ]]; then
  echo "📦  Installing API dependencies..."
  (cd "$API_DIR" && npm install)
fi

if [[ ! -d "$MOBILE_DIR/node_modules" ]]; then
  echo "📦  Installing mobile dependencies..."
  (cd "$MOBILE_DIR" && npm install)
fi

# ── 5. tmux config ────────────────────────────
TMUX_CONF="/tmp/findit_tmux.conf"
cat >"$TMUX_CONF" <<'EOF'
set -g status on
set -g status-position bottom
set -g status-style "bg=#2d2d2d fg=#ffffff"

setw -g window-status-current-format " ▶ #W "
setw -g window-status-current-style "bg=#4a9eff fg=#ffffff bold"

setw -g window-status-format " #W "
setw -g window-status-style "bg=#2d2d2d fg=#888888"

set -g status-left " 🔍 findit  "
set -g status-left-length 20
set -g status-right "  ← → switch tabs  |  Ctrl+b d detach  "
set -g status-right-length 50

bind -n C-Left  previous-window
bind -n C-Right next-window

set -g history-limit 5000
set -g allow-rename off
set -g mouse on
EOF

# ── 6. Launch tmux session ────────────────────
echo ""
echo "🚀  Launching services..."

tmux kill-session -t "$SESSION" 2>/dev/null || true

# Tab 1 – PostgreSQL + pgAdmin
tmux -f "$TMUX_CONF" new-session -d -s "$SESSION" -n "🐘 database" -x 220 -y 50 \
  "cd '$API_DIR' && docker compose up; echo; echo '[stopped] press Enter to close'; read"

# Tab 2 – NestJS API (waits for Postgres)
tmux -f "$TMUX_CONF" new-window -t "$SESSION" -n "⚙ api" \
  "cd '$API_DIR' && \
   echo 'Waiting for PostgreSQL...' && \
   until docker exec nestjs_postgres pg_isready -U api_user -d findit &>/dev/null; do sleep 1; done && \
   echo 'PostgreSQL ready.' && \
   npm run start:dev; \
   echo; echo '[stopped] press Enter to close'; read"

# Tab 3 – Expo mobile
tmux -f "$TMUX_CONF" new-window -t "$SESSION" -n "📱 mobile" \
  "cd '$MOBILE_DIR' && npx expo start; echo; echo '[stopped] press Enter to close'; read"

tmux select-window -t "$SESSION:🐘 database"

echo "✅  All services starting!"
echo ""
echo "    API (phone):  http://${IP}:${API_PORT}"
echo "    pgAdmin:      http://localhost:5050"
echo ""
echo "    ← →   switch tabs (hold Ctrl)"
echo "    Ctrl+b d   detach (keeps running in background)"
echo ""

if [[ -n "${TERM:-}" || -n "${TMUX:-}" ]]; then
  tmux -f "$TMUX_CONF" attach-session -t "$SESSION"
elif command -v ptyxis &>/dev/null; then
  ptyxis -- tmux -f "$TMUX_CONF" attach-session -t "$SESSION" &
else
  tmux -f "$TMUX_CONF" attach-session -t "$SESSION"
fi
