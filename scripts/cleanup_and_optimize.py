import os
import shutil
from pathlib import Path
import json
import re

def create_directory_structure():
    """Create the optimized directory structure."""
    directories = [
        'backend',
        'frontend',
        'shared',
        'docs',
        'tests',
        'scripts',
        'data',
        'logs'
    ]
    
    for dir_name in directories:
        os.makedirs(dir_name, exist_ok=True)

def move_files_to_appropriate_locations():
    """Move files to their appropriate locations in the new structure."""
    # Move backend files
    backend_files = [
        'server.py',
        'requirements.txt',
        '.env',
        '.env.example'
    ]
    
    for file in backend_files:
        if os.path.exists(file):
            shutil.move(file, f'backend/{file}')
    
    # Move frontend files
    frontend_files = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        '.env',
        '.env.example'
    ]
    
    for file in frontend_files:
        if os.path.exists(file):
            shutil.move(file, f'frontend/{file}')
    
    # Move documentation
    doc_files = [
        'README.md',
        'FULL_PROJECT_GUIDE.txt',
        'AI_Sports_Betting_Feature_Checklist.md'
    ]
    
    for file in doc_files:
        if os.path.exists(file):
            shutil.move(file, f'docs/{file}')
    
    # Move test files
    test_files = [
        'backend_unit_test_output.txt',
        'backend_integration_test_output.txt',
        'frontend_test_output.txt',
        'frontend_unit_test_output.txt'
    ]
    
    for file in test_files:
        if os.path.exists(file):
            shutil.move(file, f'tests/{file}')

def cleanup_unnecessary_files():
    """Remove unnecessary files and directories."""
    files_to_remove = [
        'simple_extract.txt',
        'extracted_chat.txt',
        'cursor_chunk_1.txt',
        'extracted_chat_regex.txt',
        'chat_title_lines_head.txt',
        'chat_title_lines.txt',
        'chat_head_200.html',
        'chat_head.html',
        'poe-preview (8).html',
        'chat.html'
    ]
    
    for file in files_to_remove:
        try:
            if os.path.exists(file):
                os.remove(file)
        except PermissionError:
            print(f"Warning: Could not remove {file} due to permission error")
    
    # Remove unnecessary directories
    dirs_to_remove = [
        'splitchat',
        'chat_html_split',
        'betaBuild1',
        '.pytest_cache'
    ]
    
    for dir_name in dirs_to_remove:
        try:
            if os.path.exists(dir_name):
                shutil.rmtree(dir_name)
        except PermissionError:
            print(f"Warning: Could not remove directory {dir_name} due to permission error")
        except Exception as e:
            print(f"Warning: Error removing directory {dir_name}: {str(e)}")

def consolidate_env_files():
    """Consolidate environment files."""
    env_files = [
        '.env',
        '.env.example',
        '.env.example.backend'
    ]
    
    # Create a consolidated .env.example
    consolidated_env = {}
    for env_file in env_files:
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        consolidated_env[key] = value
    
    # Write consolidated .env.example
    with open('backend/.env.example', 'w') as f:
        f.write("# Consolidated environment variables\n\n")
        for key, value in sorted(consolidated_env.items()):
            f.write(f"{key}={value}\n")

def optimize_backend_structure():
    """Optimize the backend structure."""
    backend_dirs = [
        'api',
        'core',
        'models',
        'services',
        'utils',
        'tests'
    ]
    
    for dir_name in backend_dirs:
        os.makedirs(f'backend/{dir_name}', exist_ok=True)

def optimize_frontend_structure():
    """Optimize the frontend structure."""
    frontend_dirs = [
        'src',
        'public',
        'components',
        'hooks',
        'utils',
        'styles',
        'tests'
    ]
    
    for dir_name in frontend_dirs:
        os.makedirs(f'frontend/{dir_name}', exist_ok=True)

def create_optimized_readme():
    """Create an optimized README.md file."""
    readme_content = """# AI Sports Betting Analytics Platform

## Overview
This platform provides advanced analytics and predictions for sports betting using machine learning and real-time data analysis.

## Project Structure
```
.
├── backend/           # FastAPI backend
├── frontend/         # React frontend
├── shared/           # Shared utilities
├── docs/             # Documentation
├── tests/            # Test files
├── scripts/          # Utility scripts
├── data/             # Data files
└── logs/             # Application logs
```

## Setup Instructions
1. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   python server.py

   # Start frontend
   cd frontend
   npm run dev
   ```

## Features
- Real-time sports data analysis
- Machine learning predictions
- Advanced betting strategies
- User authentication
- Performance analytics
- Historical data analysis

## Contributing
Please read our contributing guidelines in the docs directory.

## License
This project is licensed under the MIT License.
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)

def main():
    """Main function to run all optimization steps."""
    print("Starting project optimization...")
    
    # Create directory structure
    create_directory_structure()
    print("✓ Created directory structure")
    
    # Move files
    move_files_to_appropriate_locations()
    print("✓ Moved files to appropriate locations")
    
    # Cleanup
    cleanup_unnecessary_files()
    print("✓ Cleaned up unnecessary files")
    
    # Consolidate env files
    consolidate_env_files()
    print("✓ Consolidated environment files")
    
    # Optimize backend
    optimize_backend_structure()
    print("✓ Optimized backend structure")
    
    # Optimize frontend
    optimize_frontend_structure()
    print("✓ Optimized frontend structure")
    
    # Create README
    create_optimized_readme()
    print("✓ Created optimized README")
    
    print("\nProject optimization complete!")

if __name__ == "__main__":
    main() 