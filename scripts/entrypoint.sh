#!/usr/bin/env bash
set -e

export PATH="/usr/local/bin:$PATH"

echo "🚀 [RevivePay AI] Initializing backend container startup sequence..."

# 1. Wait for database if PostgreSQL is configured
if [[ "$DATABASE_URL" == *"postgresql"* || "$DATABASE_URL" == *"postgres"* ]]; then
    echo "⏳ [RevivePay AI] Validating PostgreSQL connection..."
    python3 - <<'EOF'
import sys
import time
import os
from sqlalchemy import create_engine, text

db_url = os.environ.get("DATABASE_URL", "")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"✅ [RevivePay AI] PostgreSQL connection established (attempt {attempt}).")
        sys.exit(0)
    except Exception as e:
        print(f"⏳ [RevivePay AI] Waiting for PostgreSQL (attempt {attempt}/{max_retries}): {e}")
        time.sleep(retry_interval)

print("❌ [RevivePay AI] Database connection timeout exceeded.")
sys.exit(1)
EOF
fi

# 2. Run official Alembic database migrations
echo "🔄 [RevivePay AI] Running official Alembic database migrations (alembic upgrade head)..."
alembic upgrade head
echo "✅ [RevivePay AI] Alembic database schema migrations successfully applied."

# 2.5 Initialize synthetic demo dataset (idempotent)
echo "🌱 [RevivePay AI] Ensuring canonical synthetic demo dataset is initialized..."
python3 -c "from backend.seed_data import seed_database; seed_database(force_reseed=False)"
echo "✅ [RevivePay AI] Synthetic demo dataset verified."

# 3. Start FastAPI ASGI Server
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"
echo "⚡ [RevivePay AI] Starting FastAPI application server on ${HOST}:${PORT}..."
exec uvicorn backend.main:app --host "$HOST" --port "$PORT"
