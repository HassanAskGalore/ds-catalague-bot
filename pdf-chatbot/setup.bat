@echo off
REM Catalogue RAG Chatbot Setup Script for Windows
REM This script automates the complete setup process

echo ==========================================
echo Catalogue RAG Chatbot Setup
echo ==========================================
echo.

REM Check prerequisites
echo [1/8] Checking prerequisites...

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Python not found. Please install Python 3.11+
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js not found. Please install Node.js 18+
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Docker not found. Please install Docker
    exit /b 1
)

echo OK Prerequisites check passed
echo.

REM Check for .env file
echo [2/8] Checking environment configuration...

if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo WARNING: Please edit .env and add your OPENAI_API_KEY
    echo    Then run this script again
    exit /b 1
)

findstr /C:"your_openai_api_key_here" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Please edit .env and add your OPENAI_API_KEY
    exit /b 1
)

echo OK Environment configured
echo.

REM Check for PDF
echo [3/8] Checking for PDF file...

if not exist DS-Catalogue.pdf (
    echo X DS-Catalogue.pdf not found in project root
    echo    Please copy the PDF to: %CD%\DS-Catalogue.pdf
    exit /b 1
)

echo OK PDF file found
echo.

REM Start Qdrant
echo [4/8] Starting Qdrant vector database...

docker-compose up -d qdrant

echo Waiting for Qdrant to start...
timeout /t 10 /nobreak >nul

REM Verify Qdrant is running
curl -s http://localhost:6333/collections >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo OK Qdrant is running
) else (
    echo X Qdrant failed to start
    exit /b 1
)
echo.

REM Install backend dependencies
echo [5/8] Installing backend dependencies...

cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo X Failed to install backend dependencies
    exit /b 1
)
echo OK Backend dependencies installed
echo.

REM Run ingestion
echo [6/8] Running PDF ingestion (this may take 2-3 minutes)...

python ingest.py
if %ERRORLEVEL% EQU 0 (
    echo OK Ingestion completed successfully
) else (
    echo X Ingestion failed
    exit /b 1
)
echo.

REM Install frontend dependencies
echo [7/8] Installing frontend dependencies...

cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo X Failed to install frontend dependencies
    exit /b 1
)
echo OK Frontend dependencies installed
echo.

REM Final instructions
echo ==========================================
echo OK Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   python -m api.main
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo ==========================================

cd ..
