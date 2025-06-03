from setuptools import setup, find_packages

setup(
    name='ai-sports-betting-platform',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_sqlalchemy',
        'marshmallow',
        'marshmallow-sqlalchemy',
        'pytest',
    ],
)
