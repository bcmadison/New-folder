#!/usr/bin/env python3
"""
Setup script for the system analysis tool.
"""

import os
import sys
from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand

# Read requirements from requirements.txt
with open('requirements.txt') as f:
    requirements = f.read().splitlines()

# Read test requirements from tests/requirements-test.txt
with open('tests/requirements-test.txt') as f:
    test_requirements = f.read().splitlines()

# Read README.md
with open('README.md', encoding='utf-8') as f:
    long_description = f.read()

class PyTest(TestCommand):
    """Custom test command using pytest."""
    
    def finalize_options(self):
        """Finalize options."""
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True
    
    def run_tests(self):
        """Run tests."""
        import pytest
        errno = pytest.main(self.test_args)
        sys.exit(errno)

setup(
    name='system-analysis-tool',
    version='0.1.0',
    description='AI-Powered System Analysis Tool',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='Your Name',
    author_email='your.email@example.com',
    url='https://github.com/yourusername/system-analysis-tool',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    include_package_data=True,
    install_requires=requirements,
    tests_require=test_requirements,
    cmdclass={'test': PyTest},
    entry_points={
        'console_scripts': [
            'system-analysis=src.main:main',
        ],
    },
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: System Administrators',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Topic :: System :: Systems Administration',
        'Topic :: System :: Monitoring',
        'Topic :: System :: Networking :: Monitoring',
        'Topic :: System :: Operating System',
        'Topic :: System :: Systems Administration',
        'Topic :: Utilities',
    ],
    python_requires='>=3.9',
    project_urls={
        'Bug Reports': 'https://github.com/yourusername/system-analysis-tool/issues',
        'Documentation': 'https://system-analysis-tool.readthedocs.io/',
        'Source': 'https://github.com/yourusername/system-analysis-tool',
    },
    keywords=[
        'system',
        'analysis',
        'monitoring',
        'performance',
        'security',
        'resources',
        'ai',
        'machine-learning',
        'python',
    ],
    zip_safe=False,
) 