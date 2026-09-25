import os
import shutil
import tempfile
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Detect Vercel serverless environment
IS_VERCEL = bool(os.getenv("VERCEL"))

# SQLite database setup: Vercel serverless filesystem is read-only except /tmp
candidate_db_paths = [
    BASE_DIR / "canteen_waste.db",
    BASE_DIR.parent / "backend" / "canteen_waste.db",
    BASE_DIR.parent / "canteen_waste.db",
    Path("/var/task/backend/canteen_waste.db"),
    Path("/var/task/canteen_waste.db")
]
default_db_file = next((p for p in candidate_db_paths if p.exists() and p.is_file()), None)

if IS_VERCEL:
    temp_base = Path("/tmp") if Path("/tmp").exists() else Path(tempfile.gettempdir())
    tmp_db_file = temp_base / "canteen_waste.db"
    if default_db_file and default_db_file.exists():
        if not tmp_db_file.exists() or tmp_db_file.stat().st_size == 0:
            try:
                shutil.copy2(default_db_file, tmp_db_file)
            except Exception as e:
                print(f"[WARN] Error copying DB to /tmp: {e}")
    DEFAULT_DATABASE_URL = f"sqlite:///{tmp_db_file}"
else:
    DEFAULT_DATABASE_URL = f"sqlite:///{default_db_file if default_db_file else (BASE_DIR / 'canteen_waste.db')}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Canteen Waste Predictor"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "smart-canteen-super-secret-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Default SQLite, upgradeable to PostgreSQL via DATABASE_URL env var
    DATABASE_URL: str = DEFAULT_DATABASE_URL
    
    # Host & Port for local/unified execution
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    @field_validator("PROJECT_NAME", mode="before")
    @classmethod
    def validate_project_name(cls, v):
        if not v or not str(v).strip():
            return "Smart Canteen Waste Predictor"
        return str(v)

    @field_validator("PROJECT_VERSION", mode="before")
    @classmethod
    def validate_project_version(cls, v):
        if not v or not str(v).strip():
            return "1.0.0"
        return str(v)

    @field_validator("API_V1_STR", mode="before")
    @classmethod
    def validate_api_prefix(cls, v):
        if not v or not str(v).strip():
            return "/api/v1"
        return str(v)

    @field_validator("PORT", mode="before")
    @classmethod
    def validate_port(cls, v):
        if not v or (isinstance(v, str) and not v.strip().isdigit()):
            return 8000
        return int(v)

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES", mode="before")
    @classmethod
    def validate_expire(cls, v):
        if not v or (isinstance(v, str) and not v.strip().isdigit()):
            return 60 * 24 * 7
        return int(v)


    
    # Firebase configuration
    VITE_FIREBASE_API_KEY: str = os.getenv("VITE_FIREBASE_API_KEY") or "AIzaSyC1nOhO-HvHUmZ832pU8PNhnKt04XiwkPQ"
    VITE_FIREBASE_AUTH_DOMAIN: str = os.getenv("VITE_FIREBASE_AUTH_DOMAIN") or "workshop-b96b6.firebaseapp.com"
    VITE_FIREBASE_PROJECT_ID: str = os.getenv("VITE_FIREBASE_PROJECT_ID") or "workshop-b96b6"
    VITE_FIREBASE_STORAGE_BUCKET: str = os.getenv("VITE_FIREBASE_STORAGE_BUCKET") or "workshop-b96b6.firebasestorage.app"
    VITE_FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("VITE_FIREBASE_MESSAGING_SENDER_ID") or "469841093222"
    VITE_FIREBASE_APP_ID: str = os.getenv("VITE_FIREBASE_APP_ID") or "1:469841093222:web:d7f6bbcd8ee606397183a7"
    VITE_FIREBASE_MEASUREMENT_ID: str = os.getenv("VITE_FIREBASE_MEASUREMENT_ID") or "G-V5YN0E1HYC"

    
    # ML Models directory
    MODEL_DIR: Path = (
        (Path("/tmp") if Path("/tmp").exists() else Path(tempfile.gettempdir())) / "saved_models"
        if IS_VERCEL
        else (BASE_DIR / "saved_models")
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
try:
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    if IS_VERCEL:
        candidate_model_dirs = [
            BASE_DIR / "saved_models",
            BASE_DIR.parent / "backend" / "saved_models",
            BASE_DIR.parent / "saved_models",
            Path("/var/task/backend/saved_models"),
            Path("/var/task/saved_models")
        ]
        source_model_dir = next((d for d in candidate_model_dirs if d.exists() and d.is_dir()), None)
        if source_model_dir:
            for item in source_model_dir.glob("*"):
                if item.is_file() and not (settings.MODEL_DIR / item.name).exists():
                    shutil.copy2(item, settings.MODEL_DIR / item.name)
except Exception as e:
    print(f"[WARN] Error setting up model directory: {e}")



