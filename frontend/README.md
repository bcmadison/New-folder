# AI Sports Betting Analytics Platform

## Overview
This platform provides advanced analytics and predictions for sports betting using machine learning and real-time data analysis.

## Project Structure
```
.
├── backend/           # FastAPI backend
├── frontend/         # React frontend
├── shared/           # Shared utilities
├── docs/             # Documentation
├── tests/            # Test files
├── scripts/          # Utility scripts
├── data/             # Data files
└── logs/             # Application logs
```

## Setup Instructions
1. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   python server.py

   # Start frontend
   cd frontend
   npm run dev
   ```

## Features
- Real-time sports data analysis
- Machine learning predictions
- Advanced betting strategies
- User authentication
- Performance analytics
- Historical data analysis

## Contributing
Please read our contributing guidelines in the docs directory.

## License
This project is licensed under the MIT License.
