#!/bin/bash

# ResumeBuilder Backend-Frontend Integration Startup Script

echo "🚀 Starting ResumeBuilder Integration..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the ResumeBuilder root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check if ports are available
echo "🔍 Checking port availability..."
check_port 8000
check_port 3000

# Start backend server
echo "🐍 Starting Django backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please create one first:"
    echo "   cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment and start server
source venv/bin/activate

# Run migrations
echo "📊 Running database migrations..."
python manage.py migrate

# Start Django server in background
echo "🌐 Starting Django server on http://localhost:8000"
python manage.py runserver 8000 &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend server
echo "⚛️  Starting React frontend server..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start React server in background
echo "🌐 Starting React server on http://localhost:3000"
npm start &
FRONTEND_PID=$!

# Go back to root directory
cd ..

echo ""
echo "🎉 Both servers are starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/api/"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
