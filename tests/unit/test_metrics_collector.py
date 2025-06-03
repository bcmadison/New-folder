"""
Unit tests for the metrics collector.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import psutil
from datetime import datetime

from src.monitoring.metrics_collector import MetricsCollector
from src.utils.config import Config

class TestMetricsCollector(unittest.TestCase):
    """Test cases for MetricsCollector."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = Mock(spec=Config)
        self.config.get.return_value = 60  # Default collection interval
        self.collector = MetricsCollector(self.config)
    
    @patch('psutil.cpu_times')
    @patch('psutil.cpu_percent')
    @patch('psutil.cpu_count')
    @patch('psutil.cpu_freq')
    def test_collect_cpu_metrics(self, mock_freq, mock_count, mock_percent, mock_times):
        """Test CPU metrics collection."""
        # Mock CPU times
        mock_times.return_value = MagicMock(
            user=100.0,
            system=50.0,
            idle=850.0,
            iowait=0.0
        )
        
        # Mock CPU percent
        mock_percent.return_value = 50.0
        
        # Mock CPU count
        mock_count.return_value = 4
        mock_count.side_effect = [4, 8]  # Physical and logical cores
        
        # Mock CPU frequency
        mock_freq.return_value = MagicMock(
            current=2000.0,
            min=1000.0,
            max=3000.0
        )
        
        metrics = self.collector._collect_cpu_metrics()
        
        self.assertEqual(metrics['usage_percent'], 50.0)
        self.assertEqual(metrics['count'], 4)
        self.assertEqual(metrics['count_logical'], 8)
        self.assertEqual(metrics['frequency']['current'], 2000.0)
        self.assertEqual(metrics['times']['user'], 100.0)
        self.assertEqual(metrics['times']['system'], 50.0)
        self.assertEqual(metrics['times']['idle'], 850.0)
    
    @patch('psutil.virtual_memory')
    @patch('psutil.swap_memory')
    def test_collect_memory_metrics(self, mock_swap, mock_virtual):
        """Test memory metrics collection."""
        # Mock virtual memory
        mock_virtual.return_value = MagicMock(
            total=16000000000,  # 16GB
            available=8000000000,  # 8GB
            used=6000000000,  # 6GB
            free=2000000000,  # 2GB
            percent=75.0
        )
        
        # Mock swap memory
        mock_swap.return_value = MagicMock(
            total=8000000000,  # 8GB
            used=2000000000,  # 2GB
            free=6000000000,  # 6GB
            percent=25.0
        )
        
        metrics = self.collector._collect_memory_metrics()
        
        self.assertEqual(metrics['virtual']['total'], 16000000000)
        self.assertEqual(metrics['virtual']['available'], 8000000000)
        self.assertEqual(metrics['virtual']['used'], 6000000000)
        self.assertEqual(metrics['virtual']['free'], 2000000000)
        self.assertEqual(metrics['virtual']['usage'], 75.0)
        self.assertEqual(metrics['swap']['total'], 8000000000)
        self.assertEqual(metrics['swap']['used'], 2000000000)
        self.assertEqual(metrics['swap']['free'], 6000000000)
        self.assertEqual(metrics['swap']['usage'], 25.0)
    
    @patch('psutil.disk_partitions')
    @patch('psutil.disk_usage')
    @patch('psutil.disk_io_counters')
    def test_collect_disk_metrics(self, mock_io, mock_usage, mock_partitions):
        """Test disk metrics collection."""
        # Mock disk partitions
        mock_partitions.return_value = [
            MagicMock(
                device='/dev/sda1',
                mountpoint='/',
                fstype='ext4',
                opts='rw'
            ),
            MagicMock(
                device='/dev/sda2',
                mountpoint='/home',
                fstype='ext4',
                opts='rw'
            )
        ]
        
        # Mock disk usage
        mock_usage.side_effect = [
            MagicMock(
                total=100000000000,  # 100GB
                used=50000000000,  # 50GB
                free=50000000000,  # 50GB
                percent=50.0
            ),
            MagicMock(
                total=200000000000,  # 200GB
                used=100000000000,  # 100GB
                free=100000000000,  # 100GB
                percent=50.0
            )
        ]
        
        # Mock disk I/O
        mock_io.return_value = MagicMock(
            read_bytes=1000000000,
            write_bytes=500000000,
            read_count=1000,
            write_count=500,
            read_time=100,
            write_time=50
        )
        
        metrics = self.collector._collect_disk_metrics()
        
        self.assertEqual(len(metrics['partitions']), 2)
        self.assertEqual(metrics['partitions'][0]['device'], '/dev/sda1')
        self.assertEqual(metrics['partitions'][0]['usage'], 50.0)
        self.assertEqual(metrics['io']['read_bytes'], 1000000000)
        self.assertEqual(metrics['io']['write_bytes'], 500000000)
    
    @patch('psutil.net_io_counters')
    @patch('psutil.net_connections')
    @patch('psutil.net_if_addrs')
    def test_collect_network_metrics(self, mock_addrs, mock_connections, mock_io):
        """Test network metrics collection."""
        # Mock network I/O
        mock_io.return_value = MagicMock(
            bytes_sent=1000000000,
            bytes_recv=2000000000,
            packets_sent=1000,
            packets_recv=2000,
            errin=0,
            errout=0,
            dropin=0,
            dropout=0
        )
        
        # Mock network connections
        mock_connections.return_value = [
            MagicMock(
                fd=4,
                family=2,
                type=1,
                laddr=('127.0.0.1', 80),
                raddr=('0.0.0.0', 0),
                status='LISTEN',
                pid=1000
            )
        ]
        
        # Mock network interfaces
        mock_addrs.return_value = {
            'eth0': [
                MagicMock(
                    family=2,
                    address='192.168.1.100',
                    netmask='255.255.255.0',
                    broadcast='192.168.1.255'
                )
            ]
        }
        
        metrics = self.collector._collect_network_metrics()
        
        self.assertEqual(metrics['io']['bytes_sent'], 1000000000)
        self.assertEqual(metrics['io']['bytes_recv'], 2000000000)
        self.assertEqual(metrics['connections'], 1)
        self.assertEqual(len(metrics['interfaces']), 1)
        self.assertEqual(metrics['interfaces'][0]['name'], 'eth0')
    
    @patch('psutil.process_iter')
    def test_collect_process_metrics(self, mock_process_iter):
        """Test process metrics collection."""
        # Mock process iterator
        mock_process_iter.return_value = [
            MagicMock(
                info={
                    'pid': 1000,
                    'name': 'test_process',
                    'username': 'test_user',
                    'status': 'running',
                    'cpu_percent': 50.0,
                    'memory_percent': 5.0
                }
            ),
            MagicMock(
                info={
                    'pid': 1001,
                    'name': 'test_process2',
                    'username': 'test_user',
                    'status': 'running',
                    'cpu_percent': 30.0,
                    'memory_percent': 3.0
                }
            )
        ]
        
        metrics = self.collector._collect_process_metrics()
        
        self.assertEqual(len(metrics), 2)
        self.assertEqual(metrics[0]['pid'], 1000)
        self.assertEqual(metrics[0]['name'], 'test_process')
        self.assertEqual(metrics[0]['cpu_percent'], 50.0)
        self.assertEqual(metrics[1]['pid'], 1001)
        self.assertEqual(metrics[1]['name'], 'test_process2')
        self.assertEqual(metrics[1]['cpu_percent'], 30.0)
    
    @patch('os.walk')
    @patch('os.path.getsize')
    def test_collect_file_system_metrics(self, mock_getsize, mock_walk):
        """Test file system metrics collection."""
        # Mock directory walk
        mock_walk.return_value = [
            ('/test', ['dir1', 'dir2'], ['file1.txt', 'file2.txt']),
            ('/test/dir1', [], ['file3.txt']),
            ('/test/dir2', [], ['file4.txt'])
        ]
        
        # Mock file sizes
        mock_getsize.side_effect = [
            1024,  # file1.txt
            2048,  # file2.txt
            3072,  # file3.txt
            4096   # file4.txt
        ]
        
        metrics = self.collector._collect_file_system_metrics()
        
        self.assertEqual(metrics['total_files'], 4)
        self.assertEqual(metrics['total_dirs'], 2)
        self.assertEqual(len(metrics['largest_files']), 4)

if __name__ == '__main__':
    unittest.main() 