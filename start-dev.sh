#!/bin/bash

# Start Development Servers for Aurora Audio Analyzer
# This script starts both the backend (FastAPI) and frontend (React) servers

echo "🚀 Starting Aurora Audio Analyzer Development Environment"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY and HUGGINGFACE_TOKEN"
    exit 1
fi

# Start backend in background
echo "📡 Starting FastAPI backend on port 8000..."
cd "$(dirname "$0")"
source myvenv/bin/activate 2>/dev/null || source venv/bin/activate 2>/dev/null || true
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait a moment for backend to initialize
sleep 2

# Start frontend
echo "🎨 Starting React frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "================================"
echo "🎉 Development servers running!"
echo "================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

