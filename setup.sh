#!/bin/bash
# ====================================
# Backend Setup Script for Linux/Mac
# ====================================

set -e  # Exit on any error

echo "================================"
echo "Backend Setup Script"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed!"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "[OK] Python is installed: $(python3 --version)"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "[WARNING] PostgreSQL command-line tools not found"
    echo "Make sure PostgreSQL is installed and database 'satek' is created"
    echo ""
fi

echo "Step 1: Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists, skipping creation"
else
    python3 -m venv venv
    echo "[OK] Virtual environment created"
fi
echo ""

echo "Step 2: Activating virtual environment..."
source venv/bin/activate
echo "[OK] Virtual environment activated"
echo ""

echo "Step 3: Installing dependencies..."
pip install -r requirements.txt
echo "[OK] Dependencies installed"
echo ""

echo "Step 4: Checking .env file..."
if [ -f ".env" ]; then
    echo "[OK] .env file exists"
else
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo ""
        echo "[IMPORTANT] Please edit .env file and update:"
        echo "  - DATABASE_URL with your PostgreSQL password"
        echo "  - SECRET_KEY for JWT tokens"
        echo ""
        echo "Press any key to open .env file in editor..."
        read -n 1 -s
        ${EDITOR:-nano} .env
    else
        echo "[ERROR] .env.example file not found!"
        echo "Please create .env file manually"
        exit 1
    fi
fi
echo ""

echo "Step 5: Checking database connection..."
echo "Please ensure:"
echo "  1. PostgreSQL is running"
echo "  2. Database 'satek' is created"
echo "  3. .env file has correct DATABASE_URL"
echo ""
echo "If database is ready, press any key to continue..."
read -n 1 -s
echo ""

echo "Step 6: Running database migrations..."
alembic upgrade head
echo "[OK] Database migrations completed"
echo ""

echo "================================"
echo "Setup completed successfully!"
echo "================================"
echo ""
echo "Default credentials:"
echo "  Email: admin@satek.com"
echo "  Password: admin1234"
echo ""
echo "To start the server, run:"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "Server will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
