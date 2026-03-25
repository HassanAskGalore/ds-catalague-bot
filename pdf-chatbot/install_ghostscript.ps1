# Install Ghostscript for Windows
# This script downloads and installs Ghostscript

$url = "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10040/gs10.04.0-win64.exe"
$output = "$env:TEMP\ghostscript_installer.exe"

Write-Host "Downloading Ghostscript installer..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "Running installer..." -ForegroundColor Cyan
Write-Host "Please follow the installation wizard (use default settings)" -ForegroundColor Yellow
Start-Process -FilePath $output -Wait

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Verifying installation..." -ForegroundColor Cyan

# Check if Ghostscript is installed
$gsPath = "C:\Program Files\gs\gs10.04.0\bin\gswin64c.exe"
if (Test-Path $gsPath) {
    Write-Host "Ghostscript installed successfully!" -ForegroundColor Green
    & $gsPath --version
} else {
    Write-Host "Please restart your terminal and verify with: gswin64c --version" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal" -ForegroundColor White
Write-Host "2. cd pdf-chatbot/backend" -ForegroundColor White
Write-Host "3. pip install -r requirements.txt" -ForegroundColor White
Write-Host "4. python test_camelot.py" -ForegroundColor White
