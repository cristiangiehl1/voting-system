#!/usr/bin/env bash
set -e

export $(grep -v '^#' .env | grep -m1 'DATABASE_URL' | xargs)

HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PORT="${PORT:-5432}"

echo "Aguardando PostgreSQL em $HOST:$PORT..."

while true; do
  if PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p') \
       pg_isready -h "$HOST" -p "$PORT" -q 2>/dev/null; then
    echo -e "\nPostgreSQL pronto"
    exit 0
  fi
  printf "."
  sleep 3
done
