from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.logging_middleware import LoggingMiddleware
from src.infrastructure.database.database import init_db, get_db
from src.infrastructure.database.seed import seed_database
from src.presentation.api.v1 import auth, users, inventory, warehouses, sell_transactions, activities
# Import models to ensure they are registered with SQLAlchemy
from src.domain.models import User, Warehouse, InventoryItem, SellTransaction, Activity

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="REST API for Inventory Management System"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware to track all requests
app.add_middleware(LoggingMiddleware)


@app.on_event("startup")
def on_startup():
    """Initialize database tables and seed data on application startup."""
    init_db()

    # Seed database with initial super admin user
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    """Root endpoint - API health check."""
    return {
        "message": "Inventory Management API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(warehouses.router, prefix=settings.API_V1_PREFIX)
app.include_router(inventory.router, prefix=settings.API_V1_PREFIX)
app.include_router(sell_transactions.router, prefix=settings.API_V1_PREFIX)
app.include_router(activities.router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
