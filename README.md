# Sports Prediction Engine

An advanced sports prediction engine using ensemble machine learning models.

## Features

- Multiple ML models (Traditional, Deep Learning, Time Series, Optimization)
- Ensemble prediction system
- Real-time data processing
- Performance metrics and evaluation
- Model persistence and caching

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- API keys for sports data and odds

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sports-prediction-engine
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

3. Update the `.env` file with your API keys:
```env
SPORTS_API_KEY=your_sports_api_key_here
ODDS_API_KEY=your_odds_api_key_here
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Project Structure

```
src/
├── services/
│   ├── ml/
│   │   ├── models/
│   │   │   ├── TraditionalModels.ts
│   │   │   ├── DeepLearningModels.ts
│   │   │   ├── TimeSeriesModels.ts
│   │   │   └── OptimizationModels.ts
│   │   └── ensemble/
│   │       └── EnsemblePredictor.ts
│   └── api.ts
├── types/
│   └── ml-modules.d.ts
└── index.ts
```

## Model Types

1. Traditional Models:
   - Logistic Regression
   - Random Forest
   - SVM
   - KNN
   - Naive Bayes
   - XGBoost

2. Deep Learning Models:
   - CNN
   - LSTM

3. Time Series Models:
   - ARIMA
   - Prophet

4. Optimization Models:
   - Bayesian Optimization
   - Genetic Algorithm

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 