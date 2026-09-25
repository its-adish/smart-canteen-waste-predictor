"""
Smart Canteen Waste Predictor — Unified Full-Stack Application Server
Combines React/Vite Frontend and FastAPI Machine Learning Backend into a single runner.

Execution with virtual environment:
    .\\venv\\Scripts\\python.exe app.py
or simply:
    python app.py
"""

import os
import sys
import subprocess
from pathlib import Path

# Paths configuration
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
VENV_DIR = ROOT_DIR / "venv"

# Ensure venv Python is used if available and running under different interpreter
def ensure_venv():
    if sys.platform == "win32":
        venv_python = VENV_DIR / "Scripts" / "python.exe"
    else:
        venv_python = VENV_DIR / "bin" / "python"
        
    current_exe = Path(sys.executable).resolve()
    if venv_python.exists() and current_exe != venv_python.resolve():
        # Only re-exec if not already inside this venv
        prefix = Path(sys.prefix).resolve()
        if prefix != VENV_DIR.resolve():
            print(f"[INFO] Switching to project virtual environment: {venv_python}")
            result = subprocess.run([str(venv_python)] + sys.argv)
            sys.exit(result.returncode)

ensure_venv()

# Setup Python module search paths
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure frontend production build exists
def check_frontend_build():
    index_html = FRONTEND_DIST / "index.html"
    if not index_html.exists():
        print("=" * 70)
        print("[BUILD] Frontend build not detected in 'frontend/dist'.")
        print("[BUILD] Compiling Vite production assets now...")
        print("=" * 70)
        try:
            cmd = ["npm", "run", "build"]
            subprocess.run(cmd, cwd=str(FRONTEND_DIR), check=True, shell=True)
            print("[BUILD] Frontend compiled successfully!")
        except Exception as err:
            print(f"[ERROR] Failed to compile frontend automatically: {err}")
            print("[HINT] Run 'cd frontend && npm install && npm run build' manually.")

check_frontend_build()

# Load FastAPI application from backend
from app.main import app
from app.core.config import settings

def print_banner(host: str, port: int):
    separator = "=" * 70
    print("\n" + separator)
    print("      SMART CANTEEN WASTE PREDICTOR — UNIFIED FULL-STACK SERVER")
    print(separator)
    print(f"  • Full-Stack App (Web UI):     http://{host}:{port}/")
    print(f"  • REST API Documentation:      http://{host}:{port}/docs")
    print(f"  • API Health Endpoint:         http://{host}:{port}/api/health")
    print(f"  • Firebase Config Endpoint:    http://{host}:{port}/api/firebase-config")
    print(f"  • Connected Firebase Project:  {settings.VITE_FIREBASE_PROJECT_ID}")
    print(f"  • ML Prediction Engine:        RandomForest & GradientBoosting (Active)")
    print(f"  • Python Environment:          {sys.executable}")
    print(separator + "\n")

if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Smart Canteen Waste Predictor Unified Server")
    parser.add_argument("--host", type=str, default=settings.HOST, help="Host to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=settings.PORT, help="Port to bind (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    args = parser.parse_args()

    print_banner(args.host, args.port)
    if args.reload:
        uvicorn.run("app.main:app", host=args.host, port=args.port, reload=True)
    else:
        uvicorn.run(app, host=args.host, port=args.port)

