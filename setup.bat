@echo off
REM ====================================
REM Backend Setup Script for Windows
REM ====================================

echo ================================
echo Backend Setup Script
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python is installed
echo.

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL command-line tools not found in PATH
    echo Make sure PostgreSQL is installed and database 'satek' is created
    echo.
)

echo Step 1: Creating virtual environment...
if exist venv (
    echo Virtual environment already exists, skipping creation
) else (
    python -m venv venv
    echo [OK] Virtual environment created
)
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

echo Step 3: Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo Step 4: Checking .env file...
if exist .env (
    echo [OK] .env file exists
) else (
    if exist .env.example (
        echo Creating .env file from .env.example...
        copy .env.example .env
        echo.
        echo [IMPORTANT] Please edit .env file and update:
        echo   - DATABASE_URL with your PostgreSQL password
        echo   - SECRET_KEY for JWT tokens
        echo.
        echo Press any key to open .env file in notepad...
        pause >nul
        notepad .env
    ) else (
        echo [ERROR] .env.example file not found!
        echo Please create .env file manually
        pause
        exit /b 1
    )
)
echo.

echo Step 5: Checking database connection...
echo Please ensure:
echo   1. PostgreSQL is running
echo   2. Database 'satek' is created
echo   3. .env file has correct DATABASE_URL
echo.
echo If database is ready, press any key to continue...
pause >nul
echo.

echo Step 6: Running database migrations...
alembic upgrade head
if errorlevel 1 (
    echo [ERROR] Database migration failed!
    echo Please check:
    echo   - PostgreSQL is running
    echo   - Database 'satek' exists
    echo   - DATABASE_URL in .env is correct
    pause
    exit /b 1
)
echo [OK] Database migrations completed
echo.

echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo Default credentials:
echo   Email: admin@satek.com
echo   Password: admin1234
echo.
echo To start the server, run:
echo   venv\Scripts\activate
echo   uvicorn main:app --reload
echo.
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
pause
