# generic script for database migrations
# run: python -m alembic init alembic
# run: python -m alembic revision --autogenerate -m "initial migration"
# run: python -m alembic upgrade head

from alembic import command
from alembic.config import Config
import os

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

if __name__ == "__main__":
    run_migrations()
