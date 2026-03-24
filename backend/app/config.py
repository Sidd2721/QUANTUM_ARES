# backend/app/config.py
"""
Central configuration from environment variables.
Import settings from here — never use os.getenv() directly in other files.
"""
import os
from pathlib import Path

# Database
SQLITE_PATH = os.getenv('SQLITE_PATH', str(Path(__file__).parent / 'data' / 'quantum_ares.db'))

# Auth
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production-never-use-this')
ALGORITHM = 'HS256'
TOKEN_EXPIRE_HOURS = 24

# CORS — P2's React frontend origins
ALLOWED_ORIGINS = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:3000,http://localhost:80'
).split(',')

# Blockchain mode: 'rsa' = offline-safe (default), 'polygon' = live testnet
BLOCKCHAIN_MODE = os.getenv('BLOCKCHAIN_MODE', 'rsa')

# App info
APP_VERSION = '7.75.0'
APP_TITLE = 'QUANTUM-ARES'
