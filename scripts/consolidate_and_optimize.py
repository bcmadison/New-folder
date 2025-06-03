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
from concurrent.futures import ThreadPoolExecutor

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
        self.final_app_dir = self.root_dir / "finalApp"
        self.temp_dir = self.root_dir / "temp_consolidation"
        self.processed_files: Set[str] = set()
        self.file_versions: Dict[str, List[Tuple[str, datetime]]] = {}
        self.config_files = {
            'frontend': ['package.json', 'tsconfig.json', 'vite.config.ts', 
                        'tailwind.config.js', '.env', '.env.example'],
            'backend': ['requirements.txt', 'server.py', 'config.yaml']
        }
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    def safe_copy(self, source: Path, target: Path, retries: int = None) -> bool:
        """Safely copy a file with retry logic"""
        if retries is None:
            retries = self.max_retries
            
        for attempt in range(retries):
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                return True
            except (PermissionError, OSError) as e:
                if attempt < retries - 1:
                    logging.warning(f"Attempt {attempt + 1} failed for {source}: {str(e)}")
                    time.sleep(self.retry_delay)
                else:
                    logging.error(f"Failed to copy {source} after {retries} attempts: {str(e)}")
                    return False
        return False

    def setup_directories(self):
        """Create necessary directory structure"""
        directories = [
            'frontend/src',
            'frontend/public',
            'frontend/dist',
            'backend/api',
            'backend/core',
            'backend/services',
            'backend/utils',
            'backend/models',
            'shared/utils',
            'shared/types',
            'shared/services',
            'docs',
            'tests',
            'scripts',
            'data',
            'logs',
            'config'
        ]
        
        for dir_path in directories:
            full_path = self.final_app_dir / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            logging.info(f"Created directory: {full_path}")

    def get_latest_file_version(self, file_path: str) -> Tuple[str, datetime]:
        """Get the latest version of a file across all directories"""
        versions = []
        for root, _, files in os.walk(self.root_dir):
            if file_path in files:
                full_path = Path(root) / file_path
                try:
                    mtime = datetime.fromtimestamp(full_path.stat().st_mtime)
                    versions.append((str(full_path), mtime))
                except (PermissionError, OSError) as e:
                    logging.warning(f"Could not access {full_path}: {str(e)}")
                    continue
        
        if versions:
            return max(versions, key=lambda x: x[1])
        return None

    def consolidate_config_files(self):
        """Consolidate and optimize configuration files"""
        for category, files in self.config_files.items():
            for file in files:
                latest_version = self.get_latest_file_version(file)
                if latest_version:
                    source_path, _ = latest_version
                    target_path = self.final_app_dir / category / file
                    
                    try:
                        if file.endswith('.json'):
                            self.optimize_json_file(source_path, target_path)
                        elif file.endswith('.yaml'):
                            self.optimize_yaml_file(source_path, target_path)
                        else:
                            if self.safe_copy(Path(source_path), target_path):
                                logging.info(f"Consolidated config file: {file}")
                    except Exception as e:
                        logging.error(f"Error processing config file {file}: {str(e)}")

    def optimize_json_file(self, source: str, target: str):
        """Optimize JSON files by removing comments and formatting"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                data = json.load(f)
            with open(target, 'w', encoding='utf-8') as out:
                json.dump(data, out, indent=2)
        except Exception as e:
            logging.error(f"Error processing JSON file {source}: {str(e)}")

    def optimize_yaml_file(self, source: str, target: str):
        """Optimize YAML files by removing comments and formatting"""
        try:
            with open(source, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            with open(target, 'w', encoding='utf-8') as out:
                yaml.dump(data, out, default_flow_style=False)
        except Exception as e:
            logging.error(f"Error processing YAML file {source}: {str(e)}")

    def consolidate_source_code(self):
        """Consolidate source code files"""
        source_dirs = ['src', 'betaBuild1/src', 'backend/src']
        for source_dir in source_dirs:
            source_path = self.root_dir / source_dir
            if source_path.exists():
                self._process_source_directory(source_path)

    def _process_source_directory(self, source_dir: Path):
        """Process a source directory and its contents"""
        for item in source_dir.rglob('*'):
            if item.is_file() and not any(x.startswith('.') for x in item.parts):
                try:
                    relative_path = item.relative_to(source_dir)
                    target_path = self.final_app_dir / 'frontend' / 'src' / relative_path
                    
                    if item.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                        self.optimize_typescript_file(item, target_path)
                    elif item.suffix in ['.py']:
                        self.optimize_python_file(item, target_path)
                    else:
                        if self.safe_copy(item, target_path):
                            logging.info(f"Copied file: {item.name}")
                except Exception as e:
                    logging.error(f"Error processing file {item}: {str(e)}")

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

    def optimize_imports(self, content: str) -> str:
        """Optimize import statements"""
        try:
            # Group and sort imports
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

    def consolidate_documentation(self):
        """Consolidate documentation files"""
        doc_patterns = ['*.md', '*.txt', '*.rst']
        for pattern in doc_patterns:
            for doc_file in self.root_dir.rglob(pattern):
                if 'node_modules' not in str(doc_file):
                    try:
                        target_path = self.final_app_dir / 'docs' / doc_file.name
                        if self.safe_copy(doc_file, target_path):
                            logging.info(f"Consolidated documentation: {doc_file.name}")
                    except Exception as e:
                        logging.error(f"Error consolidating documentation {doc_file}: {str(e)}")

    def consolidate_scripts(self):
        """Consolidate and optimize scripts"""
        script_patterns = ['*.bat', '*.sh', '*.py']
        for pattern in script_patterns:
            for script_file in self.root_dir.rglob(pattern):
                if 'node_modules' not in str(script_file):
                    try:
                        target_path = self.final_app_dir / 'scripts' / script_file.name
                        if self.safe_copy(script_file, target_path):
                            logging.info(f"Consolidated script: {script_file.name}")
                    except Exception as e:
                        logging.error(f"Error consolidating script {script_file}: {str(e)}")

    def cleanup(self):
        """Clean up temporary files and directories"""
        try:
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
            logging.info("Cleanup completed")
        except Exception as e:
            logging.error(f"Error during cleanup: {str(e)}")

    def run(self):
        """Run the consolidation process"""
        try:
            logging.info("Starting project consolidation")
            self.setup_directories()
            self.consolidate_config_files()
            self.consolidate_source_code()
            self.consolidate_documentation()
            self.consolidate_scripts()
            self.cleanup()
            logging.info("Project consolidation completed successfully")
        except Exception as e:
            logging.error(f"Error during consolidation: {str(e)}")
            raise

if __name__ == "__main__":
    consolidator = ProjectConsolidator(os.getcwd())
    consolidator.run() 