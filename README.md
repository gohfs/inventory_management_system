# Inventory Management System

A modern full-stack web application designed to manage stock, track item movement, and streamline buying and selling processes. This system provides an efficient way to organize items, monitor stock levels, and maintain accurate transaction history.

---

# 🚀 How to Run This App

The project contains **Frontend** and **Backend**, each located in separate branches.

---

# 📦 Frontend Setup

### 1. Clone the frontend branch
```bash
git clone -b frontend https://github.com/gohfs/inventory_management_system.git
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

### 4. Run the app
Development:
```bash
npm run dev
```

Preview production build:
```bash
npm run preview
```

---

# 🛠️ Backend Setup

### 1. Clone the backend branch
```bash
git clone -b backend https://github.com/gohfs/inventory_management_system.git
```

### 2. Create & activate virtual environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**MacOS/Linux**
```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` to match your configuration.

### 5. Ensure PostgreSQL is running and database `satek` exists
```sql
CREATE DATABASE satek;
```

### 6. Run the backend application

using Uvicorn:
```bash
uvicorn main:app --reload
```

---
