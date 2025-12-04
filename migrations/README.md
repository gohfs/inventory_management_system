# Database Migrations

This directory contains database migration scripts for the Inventory Management API.

## Migration History

1. `364cfef001b8_add_warehouse_column_to_inventory_items.py` - Added warehouse column to inventory_items table
2. `4ccb20e2177b_initial_migration_with_all_tables.py` - Initial migration capturing all existing tables

## How to Run Migrations

To apply pending migrations:
```bash
python -m alembic upgrade head
```

To create a new migration:
```bash
python -m alembic revision -m "description_of_changes"
```

To create a new migration with automatic schema detection:
```bash
python -m alembic revision --autogenerate -m "description_of_changes"
```

To mark the current database state as up-to-date without running migrations:
```bash
python -m alembic stamp head
```

## Migration Status

To check the current migration status:
```bash
python -m alembic current
```

To view the migration history:
```bash
python -m alembic history
```