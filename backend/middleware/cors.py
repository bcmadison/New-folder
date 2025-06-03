from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import socket

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def setup_cors(app: FastAPI):
    local_ip = get_local_ip()
    allowed_origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://127.0.0.1",
        f"http://{local_ip}",
        f"http://{local_ip}:3000",
        f"http://{local_ip}:5173",  # Vite dev server
    ]
    
    additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "").split(",")
    allowed_origins.extend([origin for origin in additional_origins if origin])
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
