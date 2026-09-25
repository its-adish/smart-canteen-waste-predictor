import os
import sys
import traceback
from pathlib import Path

# Setup paths for Vercel serverless environment
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR), str(CURRENT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Flag Vercel runtime
os.environ["VERCEL"] = "1"

app = None
startup_error = None

try:
    try:
        from app.main import app as fastapi_app
    except ImportError:
        from backend.app.main import app as fastapi_app
    app = fastapi_app
except Exception as e:
    startup_error = traceback.format_exc()
    print(f"[CRITICAL] Startup Error in Vercel Function: {startup_error}")

# Diagnostic fallback in case of import or dependency error
if app is None:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="Smart Canteen Waste Predictor - Diagnostics")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def diagnostic_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Function Initialization Failed",
                "details": startup_error,
                "sys_path": sys.path,
                "current_dir": str(CURRENT_DIR),
                "root_exists": ROOT_DIR.exists(),
                "backend_exists": BACKEND_DIR.exists(),
                "root_files": [f.name for f in ROOT_DIR.iterdir()] if ROOT_DIR.exists() else [],
                "backend_files": [f.name for f in BACKEND_DIR.iterdir()] if BACKEND_DIR.exists() else []
            }
        )
