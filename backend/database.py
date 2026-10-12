from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

db_url = settings.normalized_database_url

connect_args = {}
engine_kwargs = {"echo": False}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 15  # 15-second busy timeout to mitigate SQLite locking
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL connection pool & lifecycle settings for production
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True  # Liveness probe before connection checkout
    engine_kwargs["pool_recycle"] = 1800   # Recycle connections every 30 mins to avoid stale TCP sockets
    engine_kwargs["pool_timeout"] = 30     # 30-second checkout timeout

    pg_connect_args = {
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"  # 30-second server query timeout against DoS
    }
    # Enforce SSL encryption in production mode
    is_prod = settings.ENVIRONMENT.lower() == "production"
    if is_prod and "sslmode=" not in db_url.lower():
        pg_connect_args["sslmode"] = "require"

    engine_kwargs["connect_args"] = pg_connect_args

engine = create_engine(
    db_url,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

