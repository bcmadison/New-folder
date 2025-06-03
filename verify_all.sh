#!/bin/bash

echo "=== AI Sports Betting Platform - Automated Setup and Verification ==="
echo

# Set up logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/setup_$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting automated setup and verification..."

# Check Python installation
log "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    log "ERROR: Python 3 is not installed"
    echo "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi
log "Python is installed"

# Check Node.js installation
log "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log "ERROR: Node.js is not installed"
    echo "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi
log "Node.js is installed"

# Create and activate virtual environment
log "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        log "ERROR: Failed to create virtual environment"
        echo "Failed to create virtual environment"
        exit 1
    fi
fi
log "Virtual environment created"

# Activate virtual environment and install dependencies
log "Installing Python dependencies..."
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    log "ERROR: Failed to install Python dependencies"
    echo "Failed to install Python dependencies"
    exit 1
fi
log "Python dependencies installed"

# Install frontend dependencies
log "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    log "ERROR: Failed to install frontend dependencies"
    echo "Failed to install frontend dependencies"
    cd ..
    exit 1
fi
log "Frontend dependencies installed"
cd ..

# Verify ML system
log "Verifying ML system..."
python verify_ml.py
if [ $? -ne 0 ]; then
    log "ERROR: ML system verification failed"
    echo "ML system verification failed"
    exit 1
fi
log "ML system verified"

# Start backend server
log "Starting backend server..."
source venv/bin/activate
python backend/server.py > "$LOG_DIR/backend_output.log" 2>&1 &
BACKEND_PID=$!
sleep 10
log "Backend server started"

# Start frontend development server
log "Starting frontend development server..."
cd frontend
npm run dev > "../$LOG_DIR/frontend_output.log" 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 10
log "Frontend server started"

# Check if servers are running
log "Checking server status..."
if ! curl -s http://localhost:8000/health > /dev/null; then
    log "ERROR: Backend server is not responding"
    echo "Backend server is not responding. Check $LOG_DIR/backend_output.log for details."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi
log "Backend server is running"

if ! curl -s http://localhost:5173 > /dev/null; then
    log "ERROR: Frontend server is not responding"
    echo "Frontend server is not responding. Check $LOG_DIR/frontend_output.log for details."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi
log "Frontend server is running"

# Final success message
echo
echo "=== Setup Complete ==="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo
echo "Logs are available in the $LOG_DIR directory"
echo
log "Setup completed successfully"

# Keep the script running and handle cleanup on exit
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT
wait 