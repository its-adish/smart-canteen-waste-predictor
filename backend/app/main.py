from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logger import logger
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.menu import router as menu_router
from app.api.records import router as records_router
from app.api.predictions import router as predictions_router
from app.api.feedback import router as feedback_router
from app.api.models import router as models_router
from app.api.analytics import router as analytics_router
from app.seeds.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed default demo data if needed
    logger.info("Initializing Smart Canteen Waste Predictor Database...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
        logger.info("Database check & seeding completed.")
    except Exception as e:
        logger.error(f"Error during startup seeding: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Smart Canteen Waste Predictor API...")

app = FastAPI(
    title=str(settings.PROJECT_NAME or "Smart Canteen Waste Predictor"),
    version=str(settings.PROJECT_VERSION or "1.0.0"),
    description="Full-stack AI-powered Smart Canteen Waste Prediction, Preparation Recommendation, and Explainability Engine.",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Root and Frontend paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

# Include API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(menu_router, prefix=api_prefix)
app.include_router(records_router, prefix=api_prefix)
app.include_router(predictions_router, prefix=api_prefix)
app.include_router(feedback_router, prefix=api_prefix)
app.include_router(models_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": settings.PROJECT_VERSION}

@app.get("/api/firebase-config")
def get_firebase_config():
    """Returns the configured Firebase configuration"""
    return {
        "apiKey": settings.VITE_FIREBASE_API_KEY,
        "authDomain": settings.VITE_FIREBASE_AUTH_DOMAIN,
        "projectId": settings.VITE_FIREBASE_PROJECT_ID,
        "storageBucket": settings.VITE_FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.VITE_FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.VITE_FIREBASE_APP_ID,
        "measurementId": settings.VITE_FIREBASE_MEASUREMENT_ID,
    }

# Mount Vite static assets if dist exists
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

@app.get("/favicon.svg", include_in_schema=False)
async def get_favicon():
    favicon = FRONTEND_DIST / "favicon.svg"
    if favicon.exists():
        return FileResponse(favicon)
    return JSONResponse(status_code=404, content={"detail": "Not found"})

@app.get("/icons.svg", include_in_schema=False)
async def get_icons():
    icons = FRONTEND_DIST / "icons.svg"
    if icons.exists():
        return FileResponse(icons)
    return JSONResponse(status_code=404, content={"detail": "Not found"})

@app.get("/", include_in_schema=False)
def root(request: Request):
    index_file = FRONTEND_DIST / "index.html"
    accept = request.headers.get("accept", "")
    # If accessed by a web browser, serve the frontend SPA
    if "text/html" in accept and index_file.exists():
        return FileResponse(index_file)
    # If accessed by API caller or curl, return JSON API status
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "healthy",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "firebase_configured": bool(settings.VITE_FIREBASE_API_KEY)
    }

# Catch-all route for SPA client-side routing
@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    # Exclude API routes, docs, and openapi schema
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    target_file = FRONTEND_DIST / full_path
    if target_file.is_file():
        return FileResponse(target_file)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(status_code=404, content={"detail": f"Path '{full_path}' not found"})

