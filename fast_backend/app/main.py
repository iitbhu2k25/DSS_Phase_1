from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import app_router

app = FastAPI(title="Decision support system", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your API routes
app.include_router(
    app_router,
    prefix="/api",
)
