# Quick Start Script for Windows - Starts both servers
# Run this after initial setup to start both backend and frontend servers

Write-Host "🚀 Starting ResumeBuilder servers..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "README.md")) {
    Write-Host "❌ Please run this script from the ResumeBuilder root directory" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "🐍 Starting Django backend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Hackathon\ResumeBuilder\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "⚛️  Starting React frontend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Hackathon\ResumeBuilder\frontend'; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each PowerShell window to stop the servers" -ForegroundColor Yellow