@echo off
echo ========================================
echo   PDF Chatbot - Stopping All Services
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Stopping Docker containers...
docker-compose down

echo.
echo [2/2] Killing Node.js and Python processes...

REM Kill Node.js processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill Python processes on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
