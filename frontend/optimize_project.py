import os
import subprocess
import sys
from pathlib import Path

def run_optimization_scripts():
    """Run all optimization scripts in the correct order."""
    scripts = [
        'cleanup_and_optimize.py',
        'optimize_backend.py',
        'optimize_frontend.py'
    ]
    
    for script in scripts:
        print(f"\nRunning {script}...")
        try:
            subprocess.run([sys.executable, script], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error running {script}: {e}")
            return False
    return True

def create_optimized_requirements():
    """Create consolidated requirements.txt file."""
    requirements = {
        'backend': [
            'fastapi>=0.68.0',
            'uvicorn>=0.15.0',
            'sqlalchemy>=1.4.0',
            'pydantic>=1.8.0',
            'pydantic-settings>=2.0.0',
            'python-jose[cryptography]>=3.3.0',
            'passlib[bcrypt]>=1.7.4',
            'python-multipart>=0.0.5',
            'alembic>=1.7.0',
            'pytest>=6.2.0',
            'httpx>=0.23.0',
            'python-dotenv>=0.19.0',
            'numpy>=1.21.0',
            'pandas==2.0.3',
            'scikit-learn>=0.24.0',
            'tensorflow>=2.8.0',
            'torch>=1.9.0',
            'transformers>=4.11.0'
        ],
        'dev': [
            'black>=21.7b0',
            'flake8>=3.9.0',
            'mypy>=0.910',
            'isort>=5.9.0',
            'pre-commit>=2.15.0'
        ]
    }
    
    # Write backend requirements
    with open('backend/requirements.txt', 'w') as f:
        f.write('# Core dependencies\n')
        for req in requirements['backend']:
            f.write(f'{req}\n')
    
    # Write dev requirements
    with open('backend/requirements-dev.txt', 'w') as f:
        f.write('# Development dependencies\n')
        for req in requirements['dev']:
            f.write(f'{req}\n')

def create_optimized_env():
    """Create optimized .env files."""
    env_content = """# Backend Configuration
API_BASE_URL=http://localhost:8000
DATABASE_URL=sqlite:///./app.db
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Development Settings
DEBUG=True
ENVIRONMENT=development
"""
    
    # Create backend .env
    with open('backend/.env.example', 'w') as f:
        f.write(env_content)
    
    # Create frontend .env
    frontend_env = """# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
"""
    
    with open('frontend/.env.example', 'w') as f:
        f.write(frontend_env)

def create_optimized_gitignore():
    """Create optimized .gitignore file."""
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
.venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
/frontend/dist
/frontend/build

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite3

# Logs
logs/
*.log

# Testing
.coverage
htmlcov/
.pytest_cache/
.tox/

# System
.DS_Store
Thumbs.db
"""
    
    with open('.gitignore', 'w') as f:
        f.write(gitignore_content)

def main():
    """Main function to run all optimization steps."""
    print("Starting project optimization...")
    
    # Run optimization scripts
    if not run_optimization_scripts():
        print("Error: Failed to run optimization scripts")
        return
    
    # Create optimized requirements
    create_optimized_requirements()
    print("✓ Created optimized requirements")
    
    # Create optimized env files
    create_optimized_env()
    print("✓ Created optimized environment files")
    
    # Create optimized .gitignore
    create_optimized_gitignore()
    print("✓ Created optimized .gitignore")
    
    print("\nProject optimization complete!")
    print("\nNext steps:")
    print("1. Review the optimized project structure")
    print("2. Install backend dependencies: cd backend && pip install -r requirements.txt")
    print("3. Install frontend dependencies: cd frontend && npm install")
    print("4. Start the development servers:")
    print("   - Backend: cd backend && python server.py")
    print("   - Frontend: cd frontend && npm run dev")

if __name__ == "__main__":
    main() 