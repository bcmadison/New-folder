import os
import shutil
import json
import yaml
from pathlib import Path
from datetime import datetime
import logging
from typing import Dict, List, Set, Tuple
import re
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('consolidation.log'),
        logging.StreamHandler()
    ]
)

class ProjectConsolidator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.final_app_dir = self.root_dir
        self.temp_dir = self.root_dir / "temp_consolidation"
        self.processed_files: Set[str] = set()
        self.file_versions: Dict[str, List[Tuple[str, datetime]]] = {}
        self.logger = logging.getLogger(__name__)
        self.locked_files = set()
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        
        # Define source directories to process
        self.source_dirs = [
            'src',
            'betaBuild1/src',
            'backend/src',
            'frontend/src',
            'shared'
        ]
        
        # Define directories to exclude
        self.exclude_dirs = {
            'node_modules',
            '.git',
            'venv',
            '__pycache__',
            'dist',
            'build',
            '.next',
            '.vscode',
            '.idea'
        }
        
        # Define file patterns to process
        self.file_patterns = {
            'frontend': ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html'],
            'backend': ['.py', '.pyc', '.pyd'],
            'shared': ['.ts', '.tsx', '.js', '.jsx', '.py'],
            'config': ['.json', '.yaml', '.yml', '.env', '.env.example'],
            'docs': ['.md', '.txt', '.rst'],
            'scripts': ['.bat', '.sh', '.ps1']
        }

    def should_process_file(self, file_path: Path) -> bool:
        """Determine if a file should be processed"""
        # Skip if file is in excluded directory
        if any(excluded in file_path.parts for excluded in self.exclude_dirs):
            return False
            
        # Skip if file is in system directories
        if 'Python' in str(file_path) or 'Windows' in str(file_path):
            return False
            
        # Skip if file is too large (e.g., > 10MB)
        try:
            if file_path.stat().st_size > 10 * 1024 * 1024:  # 10MB
                return False
        except (PermissionError, OSError):
            return False
            
        return True

    def get_target_directory(self, file_path: Path) -> Path:
        """Determine the target directory for a file"""
        suffix = file_path.suffix.lower()
        
        # Check file patterns for each category
        for category, patterns in self.file_patterns.items():
            if suffix in patterns:
                if category == 'frontend':
                    return self.final_app_dir / 'frontend' / 'src'
                elif category == 'backend':
                    return self.final_app_dir / 'backend'
                elif category == 'shared':
                    return self.final_app_dir / 'shared'
                elif category == 'config':
                    return self.final_app_dir / 'config'
                elif category == 'docs':
                    return self.final_app_dir / 'docs'
                elif category == 'scripts':
                    return self.final_app_dir / 'scripts'
        
        # Default to the same structure as source
        return self.final_app_dir / file_path.relative_to(self.root_dir).parent

    def safe_copy(self, src, dst):
        """Safely copy a file with retries."""
        for attempt in range(self.max_retries):
            try:
                shutil.copy2(src, dst)
                return True
            except PermissionError as e:
                self.logger.warning(f"Attempt {attempt + 1} failed for {src}: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                else:
                    self.logger.error(f"Failed to copy {src} after {self.max_retries} attempts: {e}")
                    self.locked_files.add(src)
                    return False
        return True

    def process_file(self, file_path: Path):
        """Process a single file"""
        if not self.should_process_file(file_path):
            return

        try:
            target_dir = self.get_target_directory(file_path)
            target_path = target_dir / file_path.name
            
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                self.optimize_typescript_file(file_path)
            elif file_path.suffix in ['.py']:
                self.optimize_python_file(file_path)
            elif file_path.suffix in ['.json']:
                self.optimize_json_file(file_path)
            elif file_path.suffix in ['.yaml', '.yml']:
                self.optimize_yaml_file(file_path)
            elif file_path.suffix in ['.css']:
                if not self.safe_copy(file_path, target_path):
                    self.logger.warning(f"Could not copy CSS file: {file_path}")
            else:
                if self.safe_copy(file_path, target_path):
                    logging.info(f"Copied file: {file_path.name}")
        except Exception as e:
            logging.error(f"Error processing file {file_path}: {str(e)}")

    def optimize_typescript_file(self, source: Path, target: Path):
        """Optimize TypeScript/JavaScript files"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Remove console.logs in production
            content = re.sub(r'console\.log\(.*?\);', '', content)
            
            # Optimize imports
            content = self.optimize_imports(content)
            
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, 'w', encoding='utf-8') as f:
                f.write(content)
            logging.info(f"Optimized TypeScript file: {source.name}")
        except Exception as e:
            logging.error(f"Error optimizing TypeScript file {source}: {str(e)}")

    def optimize_python_file(self, source: Path, target: Path):
        """Optimize Python files"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Remove print statements in production
            content = re.sub(r'print\(.*?\)', '', content)
            
            # Optimize imports
            content = self.optimize_imports(content)
            
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, 'w', encoding='utf-8') as f:
                f.write(content)
            logging.info(f"Optimized Python file: {source.name}")
        except Exception as e:
            logging.error(f"Error optimizing Python file {source}: {str(e)}")

    def optimize_json_file(self, source: Path, target: Path):
        """Optimize JSON files"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                data = json.load(f)
            with open(target, 'w', encoding='utf-8') as out:
                json.dump(data, out, indent=2)
            logging.info(f"Optimized JSON file: {source.name}")
        except Exception as e:
            logging.error(f"Error optimizing JSON file {source}: {str(e)}")

    def optimize_yaml_file(self, source: Path, target: Path):
        """Optimize YAML files"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            with open(target, 'w', encoding='utf-8') as out:
                yaml.dump(data, out, default_flow_style=False)
            logging.info(f"Optimized YAML file: {source.name}")
        except Exception as e:
            logging.error(f"Error optimizing YAML file {source}: {str(e)}")

    def optimize_imports(self, content: str) -> str:
        """Optimize import statements"""
        try:
            import_lines = []
            other_lines = []
            
            for line in content.split('\n'):
                if line.strip().startswith(('import ', 'from ')):
                    import_lines.append(line)
                else:
                    other_lines.append(line)
            
            import_lines.sort()
            return '\n'.join(import_lines + [''] + other_lines)
        except Exception as e:
            logging.error(f"Error optimizing imports: {str(e)}")
            return content

    def run(self):
        """Run the consolidation process"""
        try:
            logging.info("Starting project consolidation")
            
            # Process each source directory
            for source_dir in self.source_dirs:
                source_path = self.root_dir / source_dir
                if source_path.exists():
                    logging.info(f"Processing directory: {source_dir}")
                    for file_path in source_path.rglob('*'):
                        if file_path.is_file():
                            self.process_file(file_path)
            
            logging.info("Project consolidation completed successfully")
        except Exception as e:
            logging.error(f"Error during consolidation: {str(e)}")
            raise

if __name__ == "__main__":
    consolidator = ProjectConsolidator(os.getcwd())
    consolidator.run() 