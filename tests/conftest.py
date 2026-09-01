import os
import pytest
from alembic.config import Config
from alembic import command
from backend.seed_data import seed_database

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """
    Session-wide fixture ensuring database schema migrations (Alembic) and seed data
    are initialized for test suites in clean CI/CD environments.
    """
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    while curr_dir and not os.path.exists(os.path.join(curr_dir, "alembic.ini")):
        parent = os.path.dirname(curr_dir)
        if parent == curr_dir:
            break
        curr_dir = parent
    root_dir = curr_dir
    alembic_ini_path = os.path.join(root_dir, "alembic.ini")
    
    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(root_dir, "alembic"))
    command.upgrade(alembic_cfg, "head")
    
    seed_database(force_reseed=False)
    yield
