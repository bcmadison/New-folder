#!/usr/bin/env python3
"""
Test runner script for the system analysis tool.
"""

import unittest
import sys
import os
import argparse
import coverage
import logging
from datetime import datetime

def setup_logging():
    """Set up logging configuration."""
    log_dir = 'test_logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_file = os.path.join(log_dir, f'test_run_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )

def run_tests(test_pattern='test_*.py', coverage_report=True):
    """Run the test suite with optional coverage reporting."""
    # Set up logging
    setup_logging()
    logger = logging.getLogger(__name__)
    
    # Start coverage if enabled
    if coverage_report:
        cov = coverage.Coverage(
            branch=True,
            source=['src'],
            omit=['*/tests/*', '*/__init__.py']
        )
        cov.start()
    
    try:
        # Discover and run tests
        logger.info('Starting test discovery...')
        test_loader = unittest.TestLoader()
        test_suite = test_loader.discover('tests', pattern=test_pattern)
        
        # Run tests
        logger.info('Running tests...')
        test_runner = unittest.TextTestRunner(verbosity=2)
        result = test_runner.run(test_suite)
        
        # Generate coverage report if enabled
        if coverage_report:
            logger.info('Generating coverage report...')
            cov.stop()
            cov.save()
            
            # Generate HTML report
            html_dir = 'coverage_html'
            if not os.path.exists(html_dir):
                os.makedirs(html_dir)
            cov.html_report(directory=html_dir)
            
            # Generate console report
            cov.report()
        
        # Return test result
        return result.wasSuccessful()
    
    except Exception as e:
        logger.error(f'Error running tests: {str(e)}')
        return False

def main():
    """Main entry point for the test runner."""
    parser = argparse.ArgumentParser(description='Run system analysis tool tests')
    parser.add_argument(
        '--pattern',
        default='test_*.py',
        help='Test file pattern to run (default: test_*.py)'
    )
    parser.add_argument(
        '--no-coverage',
        action='store_true',
        help='Disable coverage reporting'
    )
    parser.add_argument(
        '--unit',
        action='store_true',
        help='Run only unit tests'
    )
    parser.add_argument(
        '--integration',
        action='store_true',
        help='Run only integration tests'
    )
    
    args = parser.parse_args()
    
    # Determine test pattern based on arguments
    if args.unit:
        test_pattern = 'test_*_unit.py'
    elif args.integration:
        test_pattern = 'test_*_integration.py'
    else:
        test_pattern = args.pattern
    
    # Run tests
    success = run_tests(test_pattern, not args.no_coverage)
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main() 