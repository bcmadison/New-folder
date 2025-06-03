"""
Unit tests for the report generator.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import os
import json
import pandas as pd
from datetime import datetime

from src.reporting.report_generator import ReportGenerator
from src.utils.config import Config

class TestReportGenerator(unittest.TestCase):
    """Test cases for ReportGenerator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = Mock(spec=Config)
        self.config.get.side_effect = lambda key, default=None: {
            'reporting.output_directory': 'test_reports',
            'reporting.format': 'html'
        }.get(key, default)
        
        self.generator = ReportGenerator(self.config)
        
        # Create test data
        self.metrics = {
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
        
        self.analysis_results = {
            'performance': {
                'cpu': {
                    'status': 'normal',
                    'usage': 50.0,
                    'issues': []
                },
                'memory': {
                    'status': 'warning',
                    'usage': 75.0,
                    'issues': ['High memory usage']
                },
                'health': {
                    'status': 'warning',
                    'score': 75,
                    'issues': ['High memory usage']
                }
            },
            'security': {
                'ports': {
                    'status': 'normal',
                    'open_ports': 2,
                    'issues': []
                },
                'services': {
                    'status': 'normal',
                    'running_services': 5,
                    'issues': []
                },
                'health': {
                    'status': 'healthy',
                    'score': 90,
                    'issues': []
                }
            },
            'resources': {
                'disk': {
                    'status': 'normal',
                    'usage': 50.0,
                    'free': 50000000000,
                    'issues': []
                },
                'processes': {
                    'status': 'normal',
                    'total': 100,
                    'high_cpu': 2,
                    'high_memory': 1,
                    'issues': []
                },
                'health': {
                    'status': 'healthy',
                    'score': 95,
                    'issues': []
                }
            }
        }
    
    def tearDown(self):
        """Clean up test fixtures."""
        # Remove test reports directory if it exists
        if os.path.exists('test_reports'):
            for root, dirs, files in os.walk('test_reports', topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir('test_reports')
    
    @patch('jinja2.Environment')
    def test_generate_html_report(self, mock_env):
        """Test HTML report generation."""
        # Mock template rendering
        mock_template = Mock()
        mock_template.render.return_value = '<html>Test Report</html>'
        mock_env.return_value.get_template.return_value = mock_template
        
        # Generate report
        report_path = self.generator._generate_html_report(
            self.metrics,
            self.analysis_results,
            '20240101_120000'
        )
        
        # Verify report was created
        self.assertTrue(os.path.exists(report_path))
        with open(report_path, 'r') as f:
            content = f.read()
            self.assertEqual(content, '<html>Test Report</html>')
    
    def test_generate_json_report(self):
        """Test JSON report generation."""
        # Generate report
        report_path = self.generator._generate_json_report(
            self.metrics,
            self.analysis_results,
            '20240101_120000'
        )
        
        # Verify report was created
        self.assertTrue(os.path.exists(report_path))
        with open(report_path, 'r') as f:
            content = json.load(f)
            self.assertEqual(content['metrics'], self.metrics)
            self.assertEqual(content['analysis'], self.analysis_results)
    
    def test_generate_csv_report(self):
        """Test CSV report generation."""
        # Generate report
        metrics_path, analysis_path = self.generator._generate_csv_report(
            self.metrics,
            self.analysis_results,
            '20240101_120000'
        )
        
        # Verify reports were created
        self.assertTrue(os.path.exists(metrics_path))
        self.assertTrue(os.path.exists(analysis_path))
        
        # Verify metrics CSV
        metrics_df = pd.read_csv(metrics_path)
        self.assertEqual(len(metrics_df), 1)
        
        # Verify analysis CSV
        analysis_df = pd.read_csv(analysis_path)
        self.assertEqual(len(analysis_df), 1)
    
    @patch('matplotlib.pyplot')
    def test_generate_visualizations(self, mock_plt):
        """Test visualization generation."""
        # Mock matplotlib functions
        mock_plt.figure.return_value = Mock()
        mock_plt.savefig = Mock()
        mock_plt.close = Mock()
        
        # Generate visualizations
        self.generator._generate_visualizations(
            self.metrics,
            self.analysis_results,
            '20240101_120000'
        )
        
        # Verify visualization directory was created
        viz_dir = os.path.join('test_reports', 'visualizations', '20240101_120000')
        self.assertTrue(os.path.exists(viz_dir))
        
        # Verify plots were generated
        self.assertTrue(mock_plt.figure.called)
        self.assertTrue(mock_plt.savefig.called)
        self.assertTrue(mock_plt.close.called)
    
    def test_generate_report_html(self):
        """Test full report generation in HTML format."""
        # Set HTML format
        self.config.get.return_value = 'html'
        
        # Generate report
        report_path = self.generator.generate_report(self.metrics, self.analysis_results)
        
        # Verify report was created
        self.assertTrue(os.path.exists(report_path))
        self.assertTrue(report_path.endswith('.html'))
    
    def test_generate_report_json(self):
        """Test full report generation in JSON format."""
        # Set JSON format
        self.config.get.return_value = 'json'
        
        # Generate report
        report_path = self.generator.generate_report(self.metrics, self.analysis_results)
        
        # Verify report was created
        self.assertTrue(os.path.exists(report_path))
        self.assertTrue(report_path.endswith('.json'))
    
    def test_generate_report_csv(self):
        """Test full report generation in CSV format."""
        # Set CSV format
        self.config.get.return_value = 'csv'
        
        # Generate report
        report_path = self.generator.generate_report(self.metrics, self.analysis_results)
        
        # Verify reports were created
        self.assertTrue(isinstance(report_path, tuple))
        self.assertTrue(report_path[0].endswith('.csv'))
        self.assertTrue(report_path[1].endswith('.csv'))
    
    def test_generate_report_invalid_format(self):
        """Test report generation with invalid format."""
        # Set invalid format
        self.config.get.return_value = 'invalid'
        
        # Verify exception is raised
        with self.assertRaises(ValueError):
            self.generator.generate_report(self.metrics, self.analysis_results)

if __name__ == '__main__':
    unittest.main() 