"""
Integration tests for the system analysis components.
"""

import unittest
from unittest.mock import patch, MagicMock
import os
import json
from datetime import datetime

from src.main import main
from src.utils.config import Config
from src.monitoring.metrics_collector import MetricsCollector
from src.analysis.performance import PerformanceAnalyzer
from src.analysis.security import SecurityAnalyzer
from src.analysis.resources import ResourceAnalyzer
from src.reporting.report_generator import ReportGenerator

class TestSystemAnalysis(unittest.TestCase):
    """Integration tests for system analysis components."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create test configuration
        self.config = Config()
        self.config.update({
            'analysis': {
                'performance': True,
                'security': True,
                'resources': True
            },
            'monitoring': {
                'metrics_interval': 1,
                'log_level': 'INFO',
                'log_file': 'test.log'
            },
            'reporting': {
                'format': 'json',
                'output_directory': 'test_reports'
            }
        })
        
        # Create test components
        self.metrics_collector = MetricsCollector(self.config)
        self.performance_analyzer = PerformanceAnalyzer(self.config)
        self.security_analyzer = SecurityAnalyzer(self.config)
        self.resource_analyzer = ResourceAnalyzer(self.config)
        self.report_generator = ReportGenerator(self.config)
    
    def tearDown(self):
        """Clean up test fixtures."""
        # Remove test files
        if os.path.exists('test.log'):
            os.remove('test.log')
        if os.path.exists('test_reports'):
            for root, dirs, files in os.walk('test_reports', topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir('test_reports')
    
    @patch('src.monitoring.metrics_collector.MetricsCollector.collect_metrics')
    def test_full_analysis_flow(self, mock_collect_metrics):
        """Test the complete analysis flow."""
        # Mock metrics collection
        mock_collect_metrics.return_value = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'hostname': 'test-host',
                'platform': 'Linux',
                'platform_version': '5.4.0',
                'architecture': 'x86_64',
                'processor': 'Intel(R) Core(TM) i7',
                'boot_time': datetime.now().isoformat()
            },
            'cpu': {
                'usage_percent': 50.0,
                'count': 4,
                'count_logical': 8,
                'frequency': {
                    'current': 2000.0,
                    'min': 1000.0,
                    'max': 3000.0
                },
                'times': {
                    'user': 100.0,
                    'system': 50.0,
                    'idle': 850.0
                }
            },
            'memory': {
                'virtual': {
                    'total': 16000000000,
                    'available': 8000000000,
                    'used': 6000000000,
                    'free': 2000000000,
                    'usage': 75.0
                },
                'swap': {
                    'total': 8000000000,
                    'used': 2000000000,
                    'free': 6000000000,
                    'usage': 25.0
                }
            }
        }
        
        # Run analysis
        metrics = self.metrics_collector.collect_metrics()
        performance_results = self.performance_analyzer.analyze(metrics)
        security_results = self.security_analyzer.analyze(metrics)
        resource_results = self.resource_analyzer.analyze(metrics)
        
        # Combine results
        analysis_results = {
            'performance': performance_results,
            'security': security_results,
            'resources': resource_results
        }
        
        # Generate report
        report_path = self.report_generator.generate_report(metrics, analysis_results)
        
        # Verify report was created
        self.assertTrue(os.path.exists(report_path))
        
        # Verify report content
        with open(report_path, 'r') as f:
            report_data = json.load(f)
            self.assertEqual(report_data['metrics'], metrics)
            self.assertEqual(report_data['analysis'], analysis_results)
    
    @patch('src.monitoring.metrics_collector.MetricsCollector.collect_metrics')
    def test_analysis_with_high_usage(self, mock_collect_metrics):
        """Test analysis with high system usage."""
        # Mock metrics with high usage
        mock_collect_metrics.return_value = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'hostname': 'test-host',
                'platform': 'Linux',
                'platform_version': '5.4.0',
                'architecture': 'x86_64',
                'processor': 'Intel(R) Core(TM) i7',
                'boot_time': datetime.now().isoformat()
            },
            'cpu': {
                'usage_percent': 95.0,
                'count': 4,
                'count_logical': 8,
                'frequency': {
                    'current': 3000.0,
                    'min': 1000.0,
                    'max': 3000.0
                },
                'times': {
                    'user': 900.0,
                    'system': 50.0,
                    'idle': 50.0
                }
            },
            'memory': {
                'virtual': {
                    'total': 16000000000,
                    'available': 1000000000,
                    'used': 15000000000,
                    'free': 0,
                    'usage': 95.0
                },
                'swap': {
                    'total': 8000000000,
                    'used': 7000000000,
                    'free': 1000000000,
                    'usage': 87.5
                }
            }
        }
        
        # Run analysis
        metrics = self.metrics_collector.collect_metrics()
        performance_results = self.performance_analyzer.analyze(metrics)
        security_results = self.security_analyzer.analyze(metrics)
        resource_results = self.resource_analyzer.analyze(metrics)
        
        # Verify performance results
        self.assertEqual(performance_results['cpu']['status'], 'critical')
        self.assertEqual(performance_results['memory']['status'], 'critical')
        self.assertEqual(performance_results['health']['status'], 'critical')
        
        # Verify resource results
        self.assertEqual(resource_results['processes']['status'], 'warning')
        self.assertTrue(len(performance_results['health']['issues']) > 0)
    
    @patch('src.monitoring.metrics_collector.MetricsCollector.collect_metrics')
    def test_analysis_with_security_issues(self, mock_collect_metrics):
        """Test analysis with security issues."""
        # Mock metrics with security issues
        mock_collect_metrics.return_value = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'hostname': 'test-host',
                'platform': 'Linux',
                'platform_version': '5.4.0',
                'architecture': 'x86_64',
                'processor': 'Intel(R) Core(TM) i7',
                'boot_time': datetime.now().isoformat()
            },
            'security': {
                'ports': {
                    'open': [22, 80, 443, 3306, 5432],
                    'filtered': [],
                    'closed': []
                },
                'services': {
                    'running': ['sshd', 'apache2', 'mysql', 'postgresql'],
                    'enabled': ['sshd', 'apache2', 'mysql', 'postgresql']
                },
                'updates': {
                    'last_check': '2024-01-01T00:00:00',
                    'available': 50,
                    'security': 10
                }
            }
        }
        
        # Run analysis
        metrics = self.metrics_collector.collect_metrics()
        security_results = self.security_analyzer.analyze(metrics)
        
        # Verify security results
        self.assertEqual(security_results['ports']['status'], 'warning')
        self.assertEqual(security_results['services']['status'], 'warning')
        self.assertEqual(security_results['updates']['status'], 'warning')
        self.assertTrue(len(security_results['health']['issues']) > 0)
    
    def test_main_function(self):
        """Test the main function."""
        # Mock command line arguments
        with patch('sys.argv', ['main.py', '--config', 'test_config.yaml']):
            # Mock configuration loading
            with patch('src.utils.config.Config.load') as mock_load:
                mock_load.return_value = self.config
                
                # Run main function
                main()
                
                # Verify configuration was loaded
                mock_load.assert_called_once_with('test_config.yaml')

if __name__ == '__main__':
    unittest.main() 