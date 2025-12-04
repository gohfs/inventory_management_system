# Inventory Management API - Backend

FastAPI-based REST API for inventory management system with user authentication.

## Features

- User registration and authentication (JWT)
- User CRUD operations
- Clean Architecture pattern
- PostgreSQL database
- Password hashing with bcrypt
- Protected routes with middleware
- CORS enabled for frontend integration

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

4. Ensure PostgreSQL is running and database `satek` exists:
```sql
CREATE DATABASE satek;
```

### Running the Application

Start the development server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user

### Users (Protected)
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

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
- Default password: `1234`
- Tables are auto-created on first run

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
