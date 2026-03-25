@echo off
echo ========================================
echo   PDF Chatbot - Starting All Services
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/3] Starting Qdrant...
cd /d "%~dp0"
docker-compose up -d qdrant

echo Waiting for Qdrant to start...
timeout /t 10 /nobreak >nul

echo.
echo [2/3] Starting Backend API...
echo Opening new terminal for Backend...
start "PDF Chatbot - Backend API" cmd /k "cd /d "%~dp0backend" && python -m api.main"

echo Waiting for Backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend...
echo Opening new terminal for Frontend...
start "PDF Chatbot - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   All services are starting!
echo ========================================
echo.
echo Wait 10-15 seconds, then open:
echo   http://localhost:3000
echo.
echo To stop all services:
echo   - Close the Backend and Frontend terminals
echo   - Run: docker-compose down
echo.
echo ========================================
pause
