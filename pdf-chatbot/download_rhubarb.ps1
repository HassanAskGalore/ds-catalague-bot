# Download Rhubarb Lip Sync for Windows
$url = "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Windows.zip"
$output = "Rhubarb-Lip-Sync-1.13.0-Windows.zip"
$extractPath = "backend"

Write-Host "Downloading Rhubarb Lip Sync..."
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "Extracting..."
Expand-Archive -Path $output -DestinationPath $extractPath -Force

Write-Host "Cleaning up..."
Remove-Item $output

Write-Host "Done! Rhubarb installed to backend/Rhubarb-Lip-Sync-1.13.0-Windows/"
