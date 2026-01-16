"""Baseline migration - create all tables

Revision ID: 001_baseline
Revises:
Create Date: 2026-01-16

"""
from typing import Sequence, Union
import os

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables and indexes."""
    # Read and execute the SQL migration file
    migration_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(migration_dir, '001_baseline.sql')
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Execute the SQL statements
    op.execute(sql_content)


def downgrade() -> None:
    """Drop all tables in reverse order of creation."""
    # Drop tables in reverse dependency order
    op.execute("DROP TABLE IF EXISTS realtime_events CASCADE")
    op.execute("DROP TABLE IF EXISTS artifacts CASCADE")
    op.execute("DROP TABLE IF EXISTS recordings CASCADE")
    op.execute("DROP TABLE IF EXISTS messages CASCADE")
    op.execute("DROP TABLE IF EXISTS conversations CASCADE")
    op.execute("DROP TABLE IF EXISTS agent_run_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS agent_runs CASCADE")
    op.execute("DROP TABLE IF EXISTS task_events CASCADE")
    op.execute("DROP TABLE IF EXISTS tasks CASCADE")
    op.execute("DROP TABLE IF EXISTS agents CASCADE")
    op.execute("DROP TABLE IF EXISTS project_state_versions CASCADE")
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    op.execute("DROP TABLE IF EXISTS sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
