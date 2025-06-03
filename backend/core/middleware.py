from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from typing import Callable
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # 1 minute
RATE_LIMIT_MAX_REQUESTS = 100  # Max requests per window

# Store for rate limiting
request_history = {}

def setup_middleware(app: FastAPI):
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://your-production-domain.com"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next: Callable):
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean old requests
        if client_ip in request_history:
            request_history[client_ip] = [
                req_time for req_time in request_history[client_ip]
                if current_time - req_time < RATE_LIMIT_WINDOW
            ]
        
        # Check rate limit
        if client_ip in request_history and len(request_history[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        # Add current request
        if client_ip not in request_history:
            request_history[client_ip] = []
        request_history[client_ip].append(current_time)
        
        # Process request
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )

    @app.middleware("http")
    async def request_logging_middleware(request: Request, call_next: Callable):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        logger.info(
            f"Method: {request.method} Path: {request.url.path} "
            f"Status: {response.status_code} Duration: {process_time:.2f}s"
        )
        
        return response 