@echo off
echo =========================================
echo Starting SENTINEL application...
echo =========================================

echo [1/2] Starting FastAPI Backend on Port 8000...
start "SENTINEL Backend" cmd /k "cd /d d:\SENTINEL\backend && .\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Vite Frontend on Port 5173...
start "SENTINEL Frontend" cmd /k "cd /d d:\SENTINEL\frontend && npm run dev"

echo Done! The servers are booting in separate windows.
