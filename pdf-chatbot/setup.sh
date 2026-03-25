#!/bin/bash

# Catalogue RAG Chatbot Setup Script
# This script automates the complete setup process

set -e

echo "=========================================="
echo "Catalogue RAG Chatbot Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "[1/8] Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check for .env file
echo ""
echo "[2/8] Checking environment configuration..."

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo "   Then run this script again"
    exit 1
fi

# Check if OpenAI key is set
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    exit 1
fi

echo "✅ Environment configured"

# Check for PDF
echo ""
echo "[3/8] Checking for PDF file..."

if [ ! -f DS-Catalogue.pdf ]; then
    echo "❌ DS-Catalogue.pdf not found in project root"
    echo "   Please copy the PDF to: $(pwd)/DS-Catalogue.pdf"
    exit 1
fi

echo "✅ PDF file found"

# Start Qdrant
echo ""
echo "[4/8] Starting Qdrant vector database..."

docker-compose up -d qdrant

echo "Waiting for Qdrant to start..."
sleep 10

# Verify Qdrant is running
if curl -s http://localhost:6333/collections > /dev/null; then
    echo "✅ Qdrant is running"
else
    echo "❌ Qdrant failed to start"
    exit 1
fi

# Install backend dependencies
echo ""
echo "[5/8] Installing backend dependencies..."

cd backend
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Run ingestion
echo ""
echo "[6/8] Running PDF ingestion (this may take 2-3 minutes)..."

python ingest.py

if [ $? -eq 0 ]; then
    echo "✅ Ingestion completed successfully"
else
    echo "❌ Ingestion failed"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "[7/8] Installing frontend dependencies..."

cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# Final instructions
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  python -m api.main"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "=========================================="
