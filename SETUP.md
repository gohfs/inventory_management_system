# Backend Setup Guide

This guide will help you set up the backend application from scratch on a new machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.8 or higher**
   - Check version: `python --version`
   - Download from: https://www.python.org/downloads/

2. **PostgreSQL 12 or higher**
   - Check version: `psql --version`
   - Download from: https://www.postgresql.org/download/

3. **Git** (for cloning the repository)
   - Check version: `git --version`
   - Download from: https://git-scm.com/downloads

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd satek/backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup PostgreSQL Database

#### Option A: Using psql Command Line

```bash
# Login to PostgreSQL
psql -U postgres

# Inside psql, create the database:
CREATE DATABASE satek;

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Enter database name: `satek`
5. Click "Save"

### 5. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` file and update these values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/satek

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
APP_NAME=Inventory Management API
DEBUG=True

# CORS Settings (comma-separated URLs)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**IMPORTANT:** Replace `YOUR_PASSWORD` with your PostgreSQL password!

### 6. Run Database Migrations

This will create all the necessary tables in your database:

```bash
# Run all migrations
alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade -> 4ccb20e2177b, initial_migration_with_all_tables
INFO  [alembic.runtime.migration] Running upgrade 4ccb20e2177b -> 86598ce53e47, add_role_and_warehouse_support
...
INFO  [alembic.runtime.migration] Running upgrade 08fe8c0b4a33 -> c7f8d9e1a2b3, add_sell_transactions_and_activities_tables
```

### 7. Seed Initial Data (Optional but Recommended)

The application will automatically seed initial data on first startup, including:
- 1 Super Admin user (email: admin@satek.com, password: admin1234)
- 10 Warehouses across Indonesia
- 10 Inventory items (including 2 low-stock items)
- 15 Sample sell transactions
- 30+ Activity logs

Simply start the application (next step) and the seeding will run automatically.

### 8. Start the Application

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will start at: `http://localhost:8000`

### 9. Verify Installation

1. **Check API Health:**
   - Open browser: http://localhost:8000/health
   - Should return: `{"status": "healthy"}`

2. **Access API Documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test Super Admin Login:**
   - Go to: http://localhost:8000/docs
   - Click on `POST /api/v1/auth/login`
   - Click "Try it out"
   - Enter credentials:
     ```json
     {
       "email": "admin@satek.com",
       "password": "admin1234"
     }
     ```
   - Click "Execute"
   - You should receive a token in the response

## Default Credentials

**Super Admin User:**
- Email: `admin@satek.com`
- Password: `admin1234`

⚠️ **IMPORTANT:** Change this password immediately after first login in production!

## Database Schema

The application uses the following tables:

1. **users** - User accounts with roles (super_admin, warehouse)
2. **warehouses** - Warehouse locations
3. **inventory_items** - Inventory items with stock levels
4. **sell_transactions** - Sales transaction records
5. **activities** - Activity logs for all operations

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout

### Users (Protected)
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Warehouses (Protected)
- `GET /api/v1/warehouses` - List all warehouses
- `GET /api/v1/warehouses/{warehouse_id}` - Get warehouse by ID
- `POST /api/v1/warehouses` - Create warehouse
- `PUT /api/v1/warehouses/{warehouse_id}` - Update warehouse
- `DELETE /api/v1/warehouses/{warehouse_id}` - Delete warehouse

### Inventory (Protected)
- `GET /api/v1/inventories` - List all inventory items
- `GET /api/v1/inventories/stats` - Get inventory statistics
- `GET /api/v1/inventories/{item_id}` - Get inventory item by ID
- `POST /api/v1/inventories` - Create inventory item
- `PUT /api/v1/inventories/{item_id}` - Update inventory item
- `DELETE /api/v1/inventories/{item_id}` - Delete inventory item

### Sell Transactions (Protected, Super Admin only for POST)
- `POST /api/v1/sell` - Create sell transaction (Super Admin only)
- `GET /api/v1/sell` - List all sell transactions
- `GET /api/v1/sell/warehouse/{warehouse_id}` - Get transactions by warehouse
- `GET /api/v1/sell/inventory/{inventory_item_id}` - Get transactions by item

### Activity Logs (Protected)
- `GET /api/v1/activity` - Get all activities (with filters)
- `GET /api/v1/activity/entity/{entity_type}/{entity_id}` - Get entity activities

## Troubleshooting

### Database Connection Error

**Problem:** `could not connect to server: Connection refused`

**Solution:**
1. Make sure PostgreSQL is running:
   ```bash
   # Windows
   net start postgresql-x64-XX

   # Linux/Mac
   sudo service postgresql start
   ```
2. Check your `.env` file has the correct DATABASE_URL
3. Verify PostgreSQL is listening on port 5432

### Migration Error

**Problem:** `Can't locate revision identified by 'XXXXX'`

**Solution:**
```bash
# Reset migrations (WARNING: This will drop all tables!)
alembic downgrade base
alembic upgrade head
```

### Port Already in Use

**Problem:** `[Errno 98] Address already in use`

**Solution:**
```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'src'`

**Solution:**
1. Make sure you're in the `backend` directory
2. Virtual environment is activated
3. All dependencies are installed: `pip install -r requirements.txt`

## Production Deployment Checklist

Before deploying to production:

- [ ] Change default super admin password
- [ ] Set `DEBUG=False` in `.env`
- [ ] Use a strong `SECRET_KEY` (generate with: `openssl rand -hex 32`)
- [ ] Update `CORS_ORIGINS` with production frontend URL
- [ ] Use a production PostgreSQL instance (not localhost)
- [ ] Set up SSL/TLS for database connection
- [ ] Configure proper logging
- [ ] Set up automated backups for PostgreSQL
- [ ] Use a process manager (PM2, supervisord, or systemd)
- [ ] Set up monitoring and alerting
- [ ] Review and update security settings

## Support

For issues or questions:
1. Check the logs in console output
2. Review the API documentation at `/docs`
3. Contact the development team

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/
- Alembic Documentation: https://alembic.sqlalchemy.org/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
