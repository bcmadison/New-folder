import os
import sys
import unittest
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VerificationSuite:
    def __init__(self):
        self.results: Dict[str, bool] = {}
        self.errors: Dict[str, List[str]] = {}

    def verify_backend(self) -> bool:
        """Verify backend functionality"""
        try:
            # Import backend modules
            from src.backend.server import app
            from src.backend.core.database import init_db
            
            # Test database connection
            init_db()
            
            # Test API endpoints
            with app.test_client() as client:
                response = client.get('/health')
                assert response.status_code == 200
                
            self.results['backend'] = True
            return True
        except Exception as e:
            logger.error(f"Backend verification failed: {str(e)}")
            self.errors['backend'] = [str(e)]
            self.results['backend'] = False
            return False

    def verify_frontend(self) -> bool:
        """Verify frontend functionality"""
        try:
            # Check if node_modules exists
            if not os.path.exists('src/frontend/node_modules'):
                raise Exception("Frontend dependencies not installed")
            
            # Check if build files exist
            if not os.path.exists('src/frontend/dist'):
                raise Exception("Frontend not built")
            
            self.results['frontend'] = True
            return True
        except Exception as e:
            logger.error(f"Frontend verification failed: {str(e)}")
            self.errors['frontend'] = [str(e)]
            self.results['frontend'] = False
            return False

    def verify_ml(self) -> bool:
        """Verify ML system functionality"""
        try:
            # Import ML modules
            from src.backend.services.ml_service import MLService
            
            # Test model loading
            ml_service = MLService()
            assert ml_service.load_models()
            
            # Test prediction
            test_data = {"feature1": 1.0, "feature2": 2.0}
            prediction = ml_service.predict(test_data)
            assert prediction is not None
            
            self.results['ml'] = True
            return True
        except Exception as e:
            logger.error(f"ML verification failed: {str(e)}")
            self.errors['ml'] = [str(e)]
            self.results['ml'] = False
            return False

    def verify_data(self) -> bool:
        """Verify data processing functionality"""
        try:
            # Import data processing modules
            from src.backend.services.data_service import DataService
            
            # Test data loading
            data_service = DataService()
            assert data_service.load_data()
            
            # Test data processing
            processed_data = data_service.process_data()
            assert processed_data is not None
            
            self.results['data'] = True
            return True
        except Exception as e:
            logger.error(f"Data verification failed: {str(e)}")
            self.errors['data'] = [str(e)]
            self.results['data'] = False
            return False

    def run_all(self) -> bool:
        """Run all verifications"""
        verifications = [
            self.verify_backend,
            self.verify_frontend,
            self.verify_ml,
            self.verify_data
        ]
        
        all_passed = True
        for verify_func in verifications:
            if not verify_func():
                all_passed = False
        
        return all_passed

    def get_report(self) -> Dict[str, Any]:
        """Get verification report"""
        return {
            'success': all(self.results.values()),
            'results': self.results,
            'errors': self.errors
        }

def main():
    suite = VerificationSuite()
    success = suite.run_all()
    report = suite.get_report()
    
    if success:
        logger.info("All verifications passed!")
        sys.exit(0)
    else:
        logger.error("Some verifications failed!")
        logger.error(f"Report: {report}")
        sys.exit(1)

if __name__ == '__main__':
    main() 