import { BaseModel, ModelConfig, ModelPrediction } from '../models/BaseModel';
import { ARIMAModel, ProphetModel } from '../models/TimeSeriesModels';
import { BayesianOptimizationModel, GeneticAlgorithmModel } from '../models/OptimizationModels';
import { LogisticRegressionModel, RandomForestModel } from '../models/TraditionalModels';
import { CNNModel, LSTMModel } from '../models/DeepLearningModels';

interface EnsembleConfig {
  models: {
    name: string;
    type: string;
    weight: number;
    hyperparameters?: Record<string, any>;
    features: string[];
    target: string;
  }[];
  metaLearner?: {
    type: string;
    hyperparameters?: Record<string, any>;
    features: string[];
    target: string;
  };
}

interface ModelBreakdown {
  modelName: string;
  probability: number;
  confidence: number;
  weight: number;
}

interface EnsemblePrediction {
  probability: number;
  confidence: number;
  modelBreakdown: ModelBreakdown[];
  factors: string[];
  historicalAccuracy: number;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedStake: number;
  edge: number;
}

export class EnsemblePredictor {
  private models: Map<string, BaseModel>;
  private metaLearner?: BaseModel;
  private config: EnsembleConfig;
  private historicalPredictions: Map<string, { prediction: number; actual: number }[]>;

  constructor(config: EnsembleConfig) {
    this.config = config;
    this.models = new Map();
    this.historicalPredictions = new Map();
    
    // Initialize models
    this.initializeModels();
  }

  private initializeModels(): void {
    this.config.models.forEach(modelConfig => {
      let model: BaseModel;
      
      const baseConfig: ModelConfig = {
        name: modelConfig.name,
        type: modelConfig.type,
        hyperparameters: modelConfig.hyperparameters,
        features: modelConfig.features,
        target: modelConfig.target,
      };
      
      switch (modelConfig.type) {
        case 'arima':
          model = new ARIMAModel(baseConfig);
          break;
          
        case 'prophet':
          model = new ProphetModel(baseConfig);
          break;
          
        case 'bayesian':
          model = new BayesianOptimizationModel(baseConfig);
          break;
          
        case 'genetic':
          model = new GeneticAlgorithmModel(baseConfig);
          break;
          
        case 'logistic':
          model = new LogisticRegressionModel(baseConfig);
          break;
          
        case 'random-forest':
          model = new RandomForestModel(baseConfig);
          break;
          
        case 'cnn':
          model = new CNNModel(baseConfig);
          break;
          
        case 'lstm':
          model = new LSTMModel(baseConfig);
          break;
          
        default:
          throw new Error(`Unknown model type: ${modelConfig.type}`);
      }
      
      this.models.set(modelConfig.name, model);
      this.historicalPredictions.set(modelConfig.name, []);
    });
    
    // Initialize meta-learner if specified
    if (this.config.metaLearner) {
      const metaConfig: ModelConfig = {
        name: 'meta-learner',
        type: this.config.metaLearner.type,
        hyperparameters: this.config.metaLearner.hyperparameters,
        features: this.config.metaLearner.features,
        target: this.config.metaLearner.target,
      };
      
      switch (this.config.metaLearner.type) {
        case 'logistic':
          this.metaLearner = new LogisticRegressionModel(metaConfig);
          break;
          
        case 'random-forest':
          this.metaLearner = new RandomForestModel(metaConfig);
          break;
          
        default:
          throw new Error(`Unknown meta-learner type: ${this.config.metaLearner.type}`);
      }
    }
  }

  async train(data: any[]): Promise<void> {
    // Train all base models
    await Promise.all(
      Array.from(this.models.values()).map(model => model.train(data))
    );
    
    // Train meta-learner if present
    if (this.metaLearner) {
      const metaFeatures = await this.generateMetaFeatures(data);
      await this.metaLearner.train(metaFeatures);
    }
  }

  private async generateMetaFeatures(data: any[]): Promise<any[]> {
    const metaFeatures: any[] = [];
    
    for (const item of data) {
      const modelEntries = Array.from(this.models.entries());
      const predictions = await Promise.all(
        modelEntries.map(async ([name, model]) => {
          const prediction = await model.predict(item);
          return { name, prediction };
        })
      );
      
      const features: Record<string, any> = {};
      predictions.forEach(({ name, prediction }) => {
        features[`${name}_prob`] = prediction.probability;
        features[`${name}_conf`] = prediction.confidence;
      });
      
      metaFeatures.push(features);
    }
    
    return metaFeatures;
  }

  async predict(features: Record<string, any>): Promise<EnsemblePrediction> {
    // Get predictions from all models
    const predictions = await Promise.all(
      Array.from(this.models.entries()).map(async ([name, model]) => {
        const pred = await model.predict(features);
        return { name, prediction: pred };
      })
    );
    
    // Calculate weighted average if no meta-learner
    let finalProbability: number;
    let finalConfidence: number;
    
    if (this.metaLearner) {
      // Generate meta-features
      const metaFeatures: Record<string, any> = {};
      predictions.forEach(({ name, prediction }) => {
        metaFeatures[`${name}_prob`] = prediction.probability;
        metaFeatures[`${name}_conf`] = prediction.confidence;
      });
      
      // Get meta-learner prediction
      const metaPrediction = await this.metaLearner.predict(metaFeatures);
      finalProbability = metaPrediction.probability;
      finalConfidence = metaPrediction.confidence;
    } else {
      // Calculate weighted average
      const totalWeight = predictions.reduce((sum, { prediction }) => 
        sum + prediction.weight, 0
      );
      
      finalProbability = predictions.reduce((sum, { prediction }) => 
        sum + prediction.probability * prediction.weight, 0
      ) / totalWeight;
      
      finalConfidence = predictions.reduce((sum, { prediction }) => 
        sum + prediction.confidence * prediction.weight, 0
      ) / totalWeight;
    }
    
    // Calculate historical accuracy
    const historicalAccuracy = this.calculateHistoricalAccuracy();
    
    // Calculate expected value and risk level
    const { expectedValue, riskLevel } = this.calculateRiskMetrics(
      finalProbability,
      finalConfidence
    );
    
    // Calculate recommended stake
    const recommendedStake = this.calculateRecommendedStake(
      expectedValue,
      riskLevel,
      historicalAccuracy
    );
    
    // Calculate edge
    const edge = this.calculateEdge(
      finalProbability,
      expectedValue,
      historicalAccuracy
    );
    
    // Generate factors
    const factors = this.generateFactors(predictions);
    
    return {
      probability: finalProbability,
      confidence: finalConfidence,
      modelBreakdown: predictions.map(({ name, prediction }) => ({
        modelName: name,
        probability: prediction.probability,
        confidence: prediction.confidence,
        weight: prediction.weight,
      })),
      factors,
      historicalAccuracy,
      expectedValue,
      riskLevel,
      recommendedStake,
      edge,
    };
  }

  private calculateHistoricalAccuracy(): number {
    let totalCorrect = 0;
    let totalPredictions = 0;
    
    this.historicalPredictions.forEach(predictions => {
      predictions.forEach(({ prediction, actual }) => {
        if ((prediction > 0.5 && actual > 0.5) || (prediction <= 0.5 && actual <= 0.5)) {
          totalCorrect++;
        }
        totalPredictions++;
      });
    });
    
    return totalPredictions > 0 ? totalCorrect / totalPredictions : 0;
  }

  private calculateRiskMetrics(
    probability: number,
    confidence: number
  ): { expectedValue: number; riskLevel: 'low' | 'medium' | 'high' } {
    const expectedValue = probability * 2 - 1; // Convert to -1 to 1 range
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (confidence > 0.8) {
      riskLevel = 'low';
    } else if (confidence > 0.5) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }
    
    return { expectedValue, riskLevel };
  }

  private calculateRecommendedStake(
    expectedValue: number,
    riskLevel: 'low' | 'medium' | 'high',
    historicalAccuracy: number
  ): number {
    const baseStake = Math.abs(expectedValue) * historicalAccuracy;
    
    switch (riskLevel) {
      case 'low':
        return baseStake;
      case 'medium':
        return baseStake * 0.7;
      case 'high':
        return baseStake * 0.4;
    }
  }

  private calculateEdge(
    probability: number,
    expectedValue: number,
    historicalAccuracy: number
  ): number {
    return (probability - 0.5) * expectedValue * historicalAccuracy;
  }

  private generateFactors(predictions: { name: string; prediction: ModelPrediction }[]): string[] {
    const factors: string[] = [];
    
    // Add model-specific factors
    predictions.forEach(({ name, prediction }) => {
      if (prediction.confidence > 0.8) {
        factors.push(`${name} shows high confidence (${prediction.confidence.toFixed(2)})`);
      }
      if (Math.abs(prediction.probability - 0.5) > 0.3) {
        factors.push(`${name} predicts strong signal (${prediction.probability.toFixed(2)})`);
      }
    });
    
    // Add ensemble-level factors
    const avgConfidence = predictions.reduce((sum, { prediction }) => 
      sum + prediction.confidence, 0
    ) / predictions.length;
    
    if (avgConfidence > 0.7) {
      factors.push('High overall model confidence');
    }
    
    const agreement = predictions.filter(({ prediction }) => 
      (prediction.probability > 0.5) === (predictions[0].prediction.probability > 0.5)
    ).length / predictions.length;
    
    if (agreement > 0.8) {
      factors.push('Strong model agreement');
    }
    
    return factors;
  }

  async update(newData: any[]): Promise<void> {
    // Update all models
    await Promise.all(
      Array.from(this.models.values()).map(model => model.update(newData))
    );
    
    // Update historical predictions
    for (const item of newData) {
      const actual = Object.values(this.preprocessFeatures(item))[0] as number;
      
      for (const [name, model] of this.models.entries()) {
        const prediction = await model.predict(item);
        this.historicalPredictions.get(name)?.push({
          prediction: prediction.probability,
          actual,
        });
      }
    }
    
    // Retrain meta-learner if present
    if (this.metaLearner) {
      const metaFeatures = await this.generateMetaFeatures(newData);
      await this.metaLearner.train(metaFeatures);
    }
  }

  async evaluate(testData: any[]): Promise<Record<string, number>> {
    const predictions = await Promise.all(
      testData.map(d => this.predict(d))
    );
    
    const actual = testData.map(d => Object.values(this.preprocessFeatures(d))[0] as number);
    const predicted = predictions.map(p => p.probability);
    
    return {
      mse: this.calculateMSE(actual, predicted),
      mae: this.calculateMAE(actual, predicted),
      mape: this.calculateMAPE(actual, predicted),
    };
  }

  private calculateMSE(actual: number[], predicted: number[]): number {
    return actual.reduce((acc, val, i) => 
      acc + Math.pow(val - predicted[i], 2), 0
    ) / actual.length;
  }

  private calculateMAE(actual: number[], predicted: number[]): number {
    return actual.reduce((acc, val, i) => 
      acc + Math.abs(val - predicted[i]), 0
    ) / actual.length;
  }

  private calculateMAPE(actual: number[], predicted: number[]): number {
    return actual.reduce((acc, val, i) => 
      acc + Math.abs((val - predicted[i]) / val), 0
    ) / actual.length * 100;
  }

  private preprocessFeatures(features: Record<string, any>): Record<string, any> {
    // Implement feature preprocessing logic
    return features;
  }
} 