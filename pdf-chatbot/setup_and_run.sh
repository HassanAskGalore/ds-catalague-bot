#!/bin/bash

echo "========================================"
echo "Rhubarb Avatar Setup and Run Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "[1/8] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python not found! Please install Python 3.8+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found${NC}"

# Check Node
echo "[2/8] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found! Please install Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Check FFmpeg
echo "[3/8] Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}WARNING: FFmpeg not found!${NC}"
    echo "Install with: sudo apt-get install ffmpeg (Linux) or brew install ffmpeg (Mac)"
    read -p "Press Enter to continue anyway..."
else
    echo -e "${GREEN}✓ FFmpeg found${NC}"
fi

# Check .env file
echo "[4/8] Checking .env file..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}WARNING: backend/.env not found!${NC}"
    echo "Please create backend/.env with:"
    echo "AZURE_SPEECH_KEY=your_key_here"
    echo "AZURE_SPEECH_REGION=centralindia"
    echo ""
    read -p "Press Enter to continue anyway..."
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Install backend dependencies
echo "[5/8] Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install backend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Create tts_audio directory
echo "[6/8] Creating tts_audio directory..."
mkdir -p backend/tts_audio
echo -e "${GREEN}✓ tts_audio directory ready${NC}"

# Install frontend dependencies
echo "[7/8] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# Check and setup Rhubarb
echo "[8/8] Checking Rhubarb..."
if [ -f "backend/Rhubarb/rhubarb" ]; then
    chmod +x backend/Rhubarb/rhubarb
    echo -e "${GREEN}✓ Rhubarb found and made executable${NC}"
else
    echo -e "${YELLOW}WARNING: Rhubarb not found at backend/Rhubarb/rhubarb${NC}"
    echo "Please ensure Rhubarb is installed"
    read -p "Press Enter to continue..."
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Starting servers..."
echo ""
echo "Backend will start on: http://localhost:8000"
echo "Frontend will start on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
python3 -m api.main &
BACKEND_PID=$!
cd ..

echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 5

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "========================================"
echo "Servers are running!"
echo "========================================"
echo ""
echo "Open browser to: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop servers"
echo ""

# Wait for processes
wait
