import os
import sys
import subprocess
import webbrowser
from threading import Thread
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_backend():
    """Run the FastAPI backend"""
    os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))
    subprocess.run([
        'uvicorn',
        'api.main:app',
        '--host', os.getenv('API_HOST', '0.0.0.0'),
        '--port', os.getenv('API_PORT', '8000'),
        '--reload' if os.getenv('DEBUG', 'False').lower() == 'true' else '--no-reload'
    ])

def run_frontend():
    """Run the React frontend"""
    os.chdir(os.path.join(os.path.dirname(__file__), 'frontend'))
    subprocess.run(['npm', 'start'])

def open_browser():
    """Open the application in the default browser"""
    time.sleep(5)  # Wait for servers to start
    webbrowser.open('http://localhost:3000')

def main():
    """Main function to start the application"""
    try:
        # Create necessary directories
        os.makedirs(os.getenv('MODEL_DIR', 'models'), exist_ok=True)
        
        # Start backend
        backend_thread = Thread(target=run_backend)
        backend_thread.daemon = True
        backend_thread.start()
        
        # Start frontend
        frontend_thread = Thread(target=run_frontend)
        frontend_thread.daemon = True
        frontend_thread.start()
        
        # Open browser
        browser_thread = Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 