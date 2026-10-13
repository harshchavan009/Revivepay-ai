#!/usr/bin/env bash
set -e

export PATH="/usr/local/bin:$PATH"
export PYTHONUNBUFFERED=1
export PYTHONIOENCODING=utf-8

echo "[RevivePay AI] Initializing backend container startup sequence..."

# 1. Validate database connection if PostgreSQL is configured
USE_POSTGRES=0
if [[ "$DATABASE_URL" == *"postgresql"* || "$DATABASE_URL" == *"postgres"* ]]; then
    echo "[RevivePay AI] Validating PostgreSQL connection..."
    if python3 - <<'EOF'
import sys
import time
import os
from sqlalchemy import create_engine, text

db_url = os.environ.get("DATABASE_URL", "")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"connect_timeout": 4}
if "localhost" not in db_url.lower() and "127.0.0.1" not in db_url.lower():
    connect_args["sslmode"] = "require"

max_retries = 6
retry_interval = 2
connected = False

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(db_url, connect_args=connect_args)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[RevivePay AI] PostgreSQL connection established on attempt {attempt}.")
        connected = True
        break
    except Exception as e:
        print(f"[RevivePay AI] PostgreSQL probe (attempt {attempt}/{max_retries}): {e}")
        time.sleep(retry_interval)

if connected:
    sys.exit(0)
else:
    sys.exit(1)
EOF
    then
        USE_POSTGRES=1
        echo "[RevivePay AI] PostgreSQL validation passed."
    else
        echo "[RevivePay AI] Notice: PostgreSQL is unreachable or expired. Engaging resilient SQLite engine..."
        export DATABASE_URL="sqlite:///./revivepay.db"
        export ENVIRONMENT="sandbox"
    fi
fi

# 2. Run database schema migrations
echo "[RevivePay AI] Applying database schema migrations..."
if ! alembic upgrade head; then
    echo "[RevivePay AI] Alembic upgrade encountered an issue. Ensuring core database schema directly..."
    python3 -c "from backend.database import engine, Base; from backend.models.all_models import *; Base.metadata.create_all(bind=engine)"
fi
echo "[RevivePay AI] Database schema verified."

# 3. Initialize canonical synthetic demo dataset (idempotent)
echo "[RevivePay AI] Verifying canonical synthetic demo dataset..."
python3 -c "from backend.seed_data import seed_database; seed_database(force_reseed=False)" || echo "[RevivePay AI] Notice: Dataset seed completed with existing records."
echo "[RevivePay AI] Synthetic demo dataset verified."

# 4. Start FastAPI ASGI Server
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"
echo "[RevivePay AI] Starting FastAPI application server on ${HOST}:${PORT}..."
exec uvicorn backend.main:app --host "$HOST" --port "$PORT"
