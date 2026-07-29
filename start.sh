#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

LOG_DIR="$ROOT_DIR/.runtime/logs"
mkdir -p "$LOG_DIR"

pids=()
service_names=()
service_logs=()
cleanup_done=0

print_step() {
  printf "\n\033[1;36m%s\033[0m\n" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

kill_tree() {
  local pid="$1"
  local child

  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  if [ "$cleanup_done" -eq 1 ]; then
    return
  fi
  cleanup_done=1

  print_step "Stopping BAPPEDA Halut local services..."
  if [ "${#pids[@]}" -gt 0 ]; then
    for pid in "${pids[@]}"; do
      kill_tree "$pid"
    done
  fi
  wait >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

track_service() {
  local name="$1"
  local pid="$2"
  local log_file="$3"

  pids+=("$pid")
  service_names+=("$name")
  service_logs+=("$log_file")
}

is_pid_alive() {
  local pid="$1"
  local stat

  stat="$(ps -p "$pid" -o stat= 2>/dev/null | tr -d '[:space:]' || true)"
  if [ -z "$stat" ]; then
    return 1
  fi

  case "$stat" in
    Z*) return 1 ;;
    *) return 0 ;;
  esac
}

print_log_tail() {
  local log_file="$1"

  if [ -f "$log_file" ]; then
    echo
    echo "Last log lines from $log_file:"
    tail -40 "$log_file" || true
  fi
}

stop_with_error() {
  local message="$1"
  local log_file="${2:-}"

  echo
  echo "BAPPEDA Halut service monitor detected a problem:"
  echo "  $message"
  if [ -n "$log_file" ]; then
    print_log_tail "$log_file"
  fi
  exit 1
}

check_tracked_services() {
  local index

  for index in "${!pids[@]}"; do
    if ! is_pid_alive "${pids[$index]}"; then
      local status=0
      wait "${pids[$index]}" >/dev/null 2>&1 || status=$?
      stop_with_error "${service_names[$index]} stopped unexpectedly (pid ${pids[$index]}, exit $status)." "${service_logs[$index]}"
    fi
  done
}

stop_port_if_used() {
  local port="$1"
  local pids_on_port

  pids_on_port="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids_on_port" ]; then
    return
  fi

  print_step "Port $port is already in use. Stopping existing process..."
  for pid in $pids_on_port; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "Stopping PID $pid on port $port"
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done

  for _ in $(seq 1 20); do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return
    fi
    sleep 0.25
  done

  pids_on_port="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids_on_port" ]; then
    echo "Force stopping stubborn process on port $port"
    for pid in $pids_on_port; do
      kill -9 "$pid" >/dev/null 2>&1 || true
    done
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local tries=60

  for _ in $(seq 1 "$tries"); do
    check_tracked_services
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name ready: $url"
      return 0
    fi
    sleep 1
  done

  echo "$name failed to become ready: $url"
  echo "Logs:"
  echo "  $LOG_DIR"
  exit 1
}

monitor_services() {
  local health_failures=0

  while true; do
    check_tracked_services

    if curl -fsS --max-time 3 "http://127.0.0.1:$BACKEND_PORT/api/v1/documents" >/dev/null 2>&1; then
      health_failures=0
    else
      health_failures=$((health_failures + 1))
      if [ "$health_failures" -ge 3 ]; then
        stop_with_error "Laravel Backend API is no longer reachable at http://127.0.0.1:$BACKEND_PORT." "$LOG_DIR/backend.log"
      fi
    fi

    sleep 3
  done
}

require_command node
require_command npm
require_command php
require_command curl
require_command lsof
require_command pgrep

stop_port_if_used "$FRONTEND_PORT"
stop_port_if_used "$BACKEND_PORT"

print_step "Starting Laravel 11 REST API Backend..."
(
  cd "$ROOT_DIR/backend"
  exec php artisan serve --host=127.0.0.1 --port="$BACKEND_PORT"
) >"$LOG_DIR/backend.log" 2>&1 &
track_service "Laravel Backend API" "$!" "$LOG_DIR/backend.log"

print_step "Starting Next.js 15 Frontend..."
(
  cd "$ROOT_DIR/frontend"
  NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api/v1" \
  exec npm run dev -- --hostname 127.0.0.1 --port "$FRONTEND_PORT"
) >"$LOG_DIR/frontend.log" 2>&1 &
track_service "Next.js Frontend" "$!" "$LOG_DIR/frontend.log"

wait_for_url "http://127.0.0.1:$BACKEND_PORT/api/v1/documents" "Laravel Backend API"
wait_for_url "http://127.0.0.1:$FRONTEND_PORT" "Next.js Frontend"

print_step "BAPPEDA Halmahera Utara is running"
echo "Open in browser:"
echo "  Public Portal    : http://127.0.0.1:$FRONTEND_PORT"
echo "  Executive Dashboard  : http://127.0.0.1:$FRONTEND_PORT/dashboard/login"
echo "  Laravel REST API : http://127.0.0.1:$BACKEND_PORT/api/v1/documents"
echo
echo "Demo Login Accounts:"
echo "  👑 SuperAdmin    : admin@halmaherautarakab.go.id (Pass: superadmin)"
echo "  📰 Admin Umum    : umum@halmaherautarakab.go.id (Pass: admin123)"
echo "  🏗️ Admin Bidang  : infrastruktur@halmaherautarakab.go.id (Pass: bidang123)"
echo
echo "Logs Directory:"
echo "  $LOG_DIR"
echo
echo "Press Ctrl+C to stop all services."

monitor_services
