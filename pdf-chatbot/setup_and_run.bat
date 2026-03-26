@echo off
echo ========================================
echo Rhubarb Avatar Setup and Run Script
echo ========================================
echo.

REM Check Python
echo [1/8] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.8+
    pause
    exit /b 1
)
echo ✓ Python found

REM Check Node
echo [2/8] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js 16+
    pause
    exit /b 1
)
echo ✓ Node.js found

REM Check FFmpeg
echo [3/8] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo WARNING: FFmpeg not found! Install with: choco install ffmpeg
    echo Press any key to continue anyway...
    pause >nul
) else (
    echo ✓ FFmpeg found
)

REM Check .env file
echo [4/8] Checking .env file...
if not exist "backend\.env" (
    echo WARNING: backend\.env not found!
    echo Please create backend\.env with:
    echo AZURE_SPEECH_KEY=your_key_here
    echo AZURE_SPEECH_REGION=centralindia
    echo.
    echo Press any key to continue anyway...
    pause >nul
) else (
    echo ✓ .env file found
)

REM Install backend dependencies
echo [5/8] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
cd ..

REM Create tts_audio directory
echo [6/8] Creating tts_audio directory...
if not exist "backend\tts_audio" mkdir backend\tts_audio
echo ✓ tts_audio directory ready

REM Install frontend dependencies
echo [7/8] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
cd ..

REM Check Rhubarb
echo [8/8] Checking Rhubarb...
if exist "backend\Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe" (
    echo ✓ Rhubarb found
) else (
    echo WARNING: Rhubarb not found at backend\Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe
    echo Please ensure Rhubarb is installed
    pause
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Starting servers...
echo.
echo Backend will start on: http://localhost:8000
echo Frontend will start on: http://localhost:3000
echo.
echo Press Ctrl+C to stop servers
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && python -m api.main"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend: Check "Backend Server" window
echo Frontend: Check "Frontend Server" window
echo.
echo Open browser to: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
