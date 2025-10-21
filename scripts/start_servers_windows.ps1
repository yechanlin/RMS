# Quick Start Script for Windows - Starts both servers
# Run this after initial setup to start both backend and frontend servers

Write-Host "Starting RMS servers..." -ForegroundColor Green

# Get the current script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Define backend and frontend paths relative to project root
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

# Check if we have the expected directory structure
if (!(Test-Path $backendPath) -or !(Test-Path $frontendPath)) {
    Write-Host "Error: Could not find backend and frontend directories." -ForegroundColor Red
    Write-Host "Expected paths:" -ForegroundColor Yellow
    Write-Host "  Backend: $backendPath" -ForegroundColor Yellow
    Write-Host "  Frontend: $frontendPath" -ForegroundColor Yellow
    exit 1
}

# Start backend server
Write-Host "Starting Django backend server..." -ForegroundColor Yellow
Write-Host "Backend path: $backendPath" -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; .\venv\Scripts\Activate.ps1; python manage.py runserver 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting React frontend server..." -ForegroundColor Yellow
Write-Host "Frontend path: $frontendPath" -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm start"

Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each PowerShell window to stop the servers" -ForegroundColor Yellow