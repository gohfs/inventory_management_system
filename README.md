# Inventory Management API - Backend

FastAPI-based REST API for inventory management system with comprehensive features including user management, warehouse operations, inventory tracking, sell transactions, and activity logging.

## Features

- **User Management**: Registration, authentication with JWT, role-based access (Super Admin, Warehouse)
- **Warehouse Management**: CRUD operations for multiple warehouses
- **Inventory Management**: Track inventory items across warehouses with stock levels
- **Sell Transactions**: Record sales with automatic stock updates (Super Admin only)
- **Activity Logging**: Complete audit trail of all system operations
- **Clean Architecture**: Separated layers (Domain, Application, Infrastructure, Presentation)
- **Database Migrations**: Alembic for version-controlled database schema
- **Auto-Seeding**: Automatic initial data creation on first run
- **API Documentation**: Interactive Swagger UI and ReDoc

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
1. Create virtual environment
2. Install dependencies
3. Setup .env file
4. Run database migrations
5. Seed initial data

### Option 2: Manual Setup

See [SETUP.md](SETUP.md) for detailed step-by-step instructions.

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database
- Virtual environment (recommended)

### Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE satek;
```

5. Run database migrations:
```bash
alembic upgrade head
```

### Running the Application

**Important:** On first run, the application will automatically seed initial data including:
- Super Admin user (email: admin@satek.com, password: admin1234)
- 10 Warehouses across Indonesia
- 10 Inventory items (2 with low stock for testing)
- 15 Sample sell transactions
- 30+ Activity logs

Start the development server:
using uvicorn directly:
```bash
uvicorn main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Default Credentials

**Super Admin:**
- Email: `admin@satek.com`
- Password: `admin1234`

⚠️ **Change this password immediately in production!**

## API Endpoints

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user

### Users (Protected)
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Warehouses (Protected)
- `GET /api/v1/warehouses` - List all warehouses
- `POST /api/v1/warehouses` - Create warehouse
- `GET /api/v1/warehouses/{id}` - Get warehouse by ID
- `PUT /api/v1/warehouses/{id}` - Update warehouse
- `DELETE /api/v1/warehouses/{id}` - Delete warehouse

### Inventory (Protected)
- `GET /api/v1/inventories` - List all inventory items
- `GET /api/v1/inventories/stats` - Get inventory statistics
- `POST /api/v1/inventories` - Create inventory item
- `GET /api/v1/inventories/{id}` - Get inventory item by ID
- `PUT /api/v1/inventories/{id}` - Update inventory item
- `DELETE /api/v1/inventories/{id}` - Delete inventory item

### Sell Transactions (Protected)
- `POST /api/v1/sell` - Create sell transaction (Super Admin only)
- `GET /api/v1/sell` - List all sell transactions
- `GET /api/v1/sell/warehouse/{id}` - Get transactions by warehouse
- `GET /api/v1/sell/inventory/{id}` - Get transactions by inventory item

### Activity Logs (Protected)
- `GET /api/v1/activity` - Get all activities (with filters)
- `GET /api/v1/activity/entity/{type}/{id}` - Get activities for specific entity

## Project Structure

```
backend/
├── src/
│   ├── application/         # Business logic layer
│   │   └── services/        # Service classes
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings
│   │   ├── security.py      # JWT & password hashing
│   │   └── dependencies.py  # FastAPI dependencies
│   ├── domain/              # Domain models
│   │   └── models/          # SQLAlchemy models
│   ├── infrastructure/      # Infrastructure layer
│   │   ├── database/        # Database connection
│   │   └── repositories/    # Data access layer
│   └── presentation/        # API layer
│       ├── api/v1/          # API routes
│       └── schemas/         # Pydantic schemas
├── main.py                  # Application entry point
├── requirements.txt         # Dependencies
└── .env                     # Environment variables
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register or login to get a token
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your_token>
   ```

## Database

PostgreSQL database with the following configuration:
- Database name: `satek`
- Tables created via Alembic migrations
- Auto-seeding on first run

### Database Schema

The application uses these main tables:
- **users** - User accounts with role-based access
- **warehouses** - Warehouse locations
- **inventory_items** - Inventory with stock tracking
- **sell_transactions** - Sales records with automatic stock updates
- **activities** - Complete audit trail of all operations

### Migrations

```bash
# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base
```

## Low Stock Alert

Items are considered **low stock** when quantity is below 5 units. The seed data includes:
- **Wireless Mouse Logitech**: 3 units (LOW STOCK)
- **Printer HP LaserJet**: 2 units (LOW STOCK)

All items have `min_stock_level` set to 50 for testing alerts.

## Development

### Code Style

- Follow PEP 8 guidelines
- Use type hints
- Clean Architecture principles

### Adding New Endpoints

1. Create schema in `src/presentation/schemas/`
2. Create/update model in `src/domain/models/`
3. Create repository in `src/infrastructure/repositories/`
4. Create service in `src/application/services/`
5. Create router in `src/presentation/api/v1/`
6. Register router in `main.py`
