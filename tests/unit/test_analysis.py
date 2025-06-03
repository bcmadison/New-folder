"""
Unit tests for the analysis components.
"""

import unittest
from unittest.mock import Mock, patch
import psutil
from datetime import datetime

from src.analysis.performance import PerformanceAnalyzer
from src.analysis.security import SecurityAnalyzer
from src.analysis.resources import ResourceAnalyzer
from src.utils.config import Config

class TestPerformanceAnalyzer(unittest.TestCase):
    """Test cases for PerformanceAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = Mock(spec=Config)
        self.config.config_data = {
            'analysis': {
                'performance': {
                    'thresholds': {
                        'cpu': {
                            'warning': 70.0,
                            'critical': 90.0
                        },
                        'memory': {
                            'warning': 75.0,
                            'critical': 85.0
                        }
                    }
                }
            }
        }
        self.analyzer = PerformanceAnalyzer(self.config)
    
    def test_analyze_cpu_normal(self):
        """Test CPU analysis with normal usage."""
        metrics = {
            'cpu': {
                'usage_percent': 50.0,
                'times': {
                    'user': 100.0,
                    'system': 50.0,
                    'idle': 850.0
                }
            }
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['cpu']['status'], 'normal')
        self.assertEqual(len(result['cpu']['issues']), 0)
    
    def test_analyze_cpu_warning(self):
        """Test CPU analysis with warning usage."""
        metrics = {
            'cpu': {
                'usage_percent': 75.0,
                'times': {
                    'user': 150.0,
                    'system': 100.0,
                    'idle': 750.0
                }
            }
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['cpu']['status'], 'warning')
        self.assertTrue(len(result['cpu']['issues']) > 0)
    
    def test_analyze_cpu_critical(self):
        """Test CPU analysis with critical usage."""
        metrics = {
            'cpu': {
                'usage_percent': 95.0,
                'times': {
                    'user': 200.0,
                    'system': 150.0,
                    'idle': 650.0
                }
            }
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['cpu']['status'], 'critical')
        self.assertTrue(len(result['cpu']['issues']) > 0)

class TestSecurityAnalyzer(unittest.TestCase):
    """Test cases for SecurityAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = Mock(spec=Config)
        self.config.config_data = {
            'analysis': {
                'security': {
                    'checks': {
                        'ports': {
                            'enabled': True,
                            'warning_threshold': 5
                        },
                        'services': {
                            'enabled': True,
                            'critical_services': ['ssh', 'http']
                        }
                    }
                }
            }
        }
        self.analyzer = SecurityAnalyzer(self.config)
    
    def test_analyze_ports_normal(self):
        """Test port analysis with normal state."""
        metrics = {
            'ports': [
                {'port': 80, 'state': 'LISTEN'},
                {'port': 443, 'state': 'LISTEN'}
            ]
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['ports']['status'], 'normal')
        self.assertEqual(len(result['ports']['issues']), 0)
    
    def test_analyze_ports_warning(self):
        """Test port analysis with warning state."""
        metrics = {
            'ports': [
                {'port': 80, 'state': 'LISTEN'},
                {'port': 443, 'state': 'LISTEN'},
                {'port': 22, 'state': 'LISTEN'},
                {'port': 21, 'state': 'LISTEN'},
                {'port': 23, 'state': 'LISTEN'},
                {'port': 25, 'state': 'LISTEN'}
            ]
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['ports']['status'], 'warning')
        self.assertTrue(len(result['ports']['issues']) > 0)

class TestResourceAnalyzer(unittest.TestCase):
    """Test cases for ResourceAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = Mock(spec=Config)
        self.config.config_data = {
            'analysis': {
                'resources': {
                    'thresholds': {
                        'disk': {
                            'warning': 80.0,
                            'critical': 90.0
                        },
                        'memory': {
                            'warning': 75.0,
                            'critical': 85.0
                        }
                    }
                }
            }
        }
        self.analyzer = ResourceAnalyzer(self.config)
    
    def test_analyze_disk_normal(self):
        """Test disk analysis with normal usage."""
        metrics = {
            'disk': {
                'usage': 50.0,
                'free': 50000000000,
                'total': 100000000000
            }
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['disk']['status'], 'normal')
        self.assertEqual(len(result['disk']['issues']), 0)
    
    def test_analyze_disk_warning(self):
        """Test disk analysis with warning usage."""
        metrics = {
            'disk': {
                'usage': 85.0,
                'free': 15000000000,
                'total': 100000000000
            }
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['disk']['status'], 'warning')
        self.assertTrue(len(result['disk']['issues']) > 0)
    
    def test_analyze_processes(self):
        """Test process analysis."""
        metrics = {
            'processes': [
                {
                    'pid': 1,
                    'name': 'test1',
                    'cpu_percent': 60.0,
                    'memory_percent': 6.0,
                    'status': 'running'
                },
                {
                    'pid': 2,
                    'name': 'test2',
                    'cpu_percent': 30.0,
                    'memory_percent': 3.0,
                    'status': 'running'
                }
            ]
        }
        result = self.analyzer.analyze(metrics)
        self.assertEqual(result['processes']['total'], 2)
        self.assertEqual(len(result['processes']['high_cpu']), 1)
        self.assertEqual(len(result['processes']['high_memory']), 1)

if __name__ == '__main__':
    unittest.main() 