import os
import sys
from pathlib import Path

# Setup paths for Vercel serverless environment
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Flag Vercel runtime
os.environ["VERCEL"] = "1"

# Import the FastAPI application instance
from app.main import app as fastapi_app

# Expose app for Vercel Python runtime
app = fastapi_app
