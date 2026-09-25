@echo off
REM =========================================================================
REM Smart Canteen Waste Predictor — Launcher
REM Launches combined Frontend + Backend server using the virtual environment
REM =========================================================================

echo Starting Smart Canteen Waste Predictor...
cd /d "%~dp0"

IF EXIST "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" run.py %*
) ELSE (
    echo [WARNING] venv\Scripts\python.exe not found. Falling back to system python...
    python run.py %*
)

pause
