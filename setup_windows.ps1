# ResumeBuilder Setup Script for Windows
# This script sets up the entire ResumeBuilder project

Write-Host "🚀 Setting up ResumeBuilder project..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "README.md")) {
    Write-Host "❌ Please run this script from the ResumeBuilder root directory" -ForegroundColor Red
    exit 1
}

# Backend Setup
Write-Host "🐍 Setting up Django backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment if it doesn't exist
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    Copy-Item env.example .env
    Write-Host "⚠️  Please edit .env file to add your API keys!" -ForegroundColor Yellow
}

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
python manage.py migrate

# Go back to root
Set-Location ..

# Frontend Setup
Write-Host "⚛️  Setting up React frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

# Go back to root
Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the servers:" -ForegroundColor Cyan
Write-Host "Backend:  cd backend && .\venv\Scripts\Activate.ps1 && python manage.py runserver 8000" -ForegroundColor White
Write-Host "Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "Or use the quick start script: .\start_servers_windows.ps1" -ForegroundColor Cyan