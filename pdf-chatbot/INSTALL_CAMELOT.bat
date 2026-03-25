@echo off
echo ================================================================
echo CAMELOT INSTALLATION SCRIPT
echo ================================================================
echo.

echo [1/4] Uninstalling old Docling dependencies...
pip uninstall -y docling transformers torch torchvision torchaudio
echo.

echo [2/4] Installing Camelot and dependencies...
cd backend
pip install -r requirements.txt
echo.

echo [3/4] Checking Ghostscript installation...
where gswin64c >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Ghostscript is installed
) else (
    echo   ✗ Ghostscript NOT found!
    echo.
    echo   Please install Ghostscript:
    echo   1. Download from: https://ghostscript.com/releases/gsdnld.html
    echo   2. Or use chocolatey: choco install ghostscript
    echo.
    pause
)
echo.

echo [4/4] Testing Camelot...
python test_camelot.py
echo.

echo ================================================================
echo INSTALLATION COMPLETE!
echo ================================================================
echo.
echo Next steps:
echo   1. Ensure Qdrant is running: docker-compose up -d qdrant
echo   2. Re-index the PDF: python ingest.py
echo   3. Start backend: python -m api.main
echo.
pause
