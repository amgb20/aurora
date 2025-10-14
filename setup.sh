#!/bin/bash

# Audio Compatibility Pipeline Setup Script

echo "🚀 Setting up Audio Compatibility Pipeline..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found."
    echo "📝 Creating .env file from template..."
    
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "✅ Created .env file. Please edit it and add your OpenAI API key."
        echo ""
        echo "To edit: nano .env (or use your preferred editor)"
        echo "Set: OPENAI_API_KEY=your_actual_api_key_here"
        echo ""
        read -p "Press Enter after you've added your API key..."
    else
        echo "Please create a .env file with OPENAI_API_KEY=your_api_key"
        exit 1
    fi
fi

# Build and start the Docker containers
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

# Wait for the service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Check if the service is running
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Service is running!"
    echo ""
    echo "📋 Available endpoints:"
    echo "  - API Documentation: http://localhost:8000/docs"
    echo "  - Health Check: http://localhost:8000/"
    echo "  - POST /transcribe"
    echo "  - POST /summarise"
    echo "  - POST /match"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop service: docker-compose down"
else
    echo "❌ Service failed to start. Check logs with: docker-compose logs"
    exit 1
fi

