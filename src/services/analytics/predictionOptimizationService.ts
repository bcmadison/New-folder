import { mlService } from './mlService';
import { advancedMLService } from './advancedMLService';
import { timeSeriesService } from './timeSeriesService';
import { clusteringService } from './clusteringService';
import { featureEngineeringService } from './featureEngineeringService';
import { riskModelingService } from './riskModelingService';

interface OptimizedPrediction {
  prediction: number;
  confidence: number;
  riskAssessment: {
    riskScore: number;
    maxStake: number;
    expectedValue: number;
  };
  insights: {
    modelWeights: Record<string, number>;
    featureImportance: Record<string, number>;
    confidenceIntervals: [number, number];
  };
}

interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  calibrationScore: number;
  recentPerformance: number[];
}

interface OptimizationConfig {
  modelSelection: {
    method: 'bayesian' | 'genetic' | 'thompson';
    params: {
      explorationRate: number;
      minSampleSize: number;
      maxTrials: number;
    };
  };
  ensembleWeights: {
    method: 'dynamic' | 'static' | 'adaptive';
    updateInterval: number;
    minWeight: number;
  };
  calibration: {
    method: 'platt' | 'isotonic' | 'beta';
    validationSize: number;
    recalibrationThreshold: number;
  };
}

class PredictionOptimizationService {
  private readonly modelWeightUpdateInterval = 24 * 60 * 60 * 1000; // 24 hours
  private modelWeights: Map<string, number> = new Map();
  private lastWeightUpdate: Date = new Date();
  private modelPerformance: Map<string, ModelPerformanceMetrics> = new Map();
  private optimizationConfig: OptimizationConfig = {
    modelSelection: {
      method: 'bayesian',
      params: {
        explorationRate: 0.1,
        minSampleSize: 1000,
        maxTrials: 100
      }
    },
    ensembleWeights: {
      method: 'adaptive',
      updateInterval: 24 * 60 * 60 * 1000, // 24 hours
      minWeight: 0.05
    },
    calibration: {
      method: 'isotonic',
      validationSize: 0.2,
      recalibrationThreshold: 0.1
    }
  };

  constructor() {
    this.initializeModelWeights();
    this.startWeightUpdateInterval();
    this.initializeModelPerformanceTracking();
  }

  private initializeModelWeights() {
    // Initialize with equal weights
    this.modelWeights.set('basic', 0.2);
    this.modelWeights.set('advanced', 0.2);
    this.modelWeights.set('timeSeries', 0.2);
    this.modelWeights.set('clustering', 0.2);
    this.modelWeights.set('ensemble', 0.2);
  }

  private startWeightUpdateInterval() {
    setInterval(() => {
      this.updateModelWeights();
    }, this.modelWeightUpdateInterval);
  }

  private initializeModelPerformanceTracking() {
    const defaultMetrics: ModelPerformanceMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      auc: 0,
      calibrationScore: 0,
      recentPerformance: []
    };

    ['basic', 'advanced', 'timeSeries', 'clustering', 'ensemble'].forEach(model => {
      this.modelPerformance.set(model, { ...defaultMetrics });
    });
  }

  private async updateModelWeights() {
    try {
      // Get historical performance metrics for each model
      const basicMetrics = await mlService.getModelMetrics();
      const advancedMetrics = await advancedMLService.getModelMetrics();
      const timeSeriesMetrics = await timeSeriesService.getMetrics();
      
      // Calculate new weights based on performance
      const totalAccuracy = 
        basicMetrics.accuracy +
        advancedMetrics.accuracy +
        timeSeriesMetrics.r2;
      
      this.modelWeights.set('basic', basicMetrics.accuracy / totalAccuracy);
      this.modelWeights.set('advanced', advancedMetrics.accuracy / totalAccuracy);
      this.modelWeights.set('timeSeries', timeSeriesMetrics.r2 / totalAccuracy);
      
      this.lastWeightUpdate = new Date();
    } catch (error) {
      console.error('Failed to update model weights:', error);
    }
  }

  private async updateModelPerformance(modelType: string, prediction: any, actual: any) {
    const metrics = this.modelPerformance.get(modelType);
    if (!metrics) return;

    // Calculate new performance metrics
    const newMetrics = await this.calculatePerformanceMetrics(prediction, actual);
    
    // Update metrics with exponential moving average
    const alpha = 0.1;
    Object.keys(newMetrics).forEach(key => {
      if (key !== 'recentPerformance') {
        metrics[key] = alpha * newMetrics[key] + (1 - alpha) * metrics[key];
      }
    });

    // Update recent performance
    metrics.recentPerformance.push(newMetrics.accuracy);
    if (metrics.recentPerformance.length > 100) {
      metrics.recentPerformance.shift();
    }

    this.modelPerformance.set(modelType, metrics);
  }

  private async calculatePerformanceMetrics(prediction: any, actual: any): Promise<ModelPerformanceMetrics> {
    // Implement performance metric calculations
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      auc: 0,
      calibrationScore: 0,
      recentPerformance: []
    };
  }

  private async selectOptimalModels(): Promise<string[]> {
    switch (this.optimizationConfig.modelSelection.method) {
      case 'bayesian':
        return this.bayesianModelSelection();
      case 'genetic':
        return this.geneticModelSelection();
      case 'thompson':
        return this.thompsonSamplingSelection();
      default:
        throw new Error(`Model selection method ${this.optimizationConfig.modelSelection.method} not supported`);
    }
  }

  private async bayesianModelSelection(): Promise<string[]> {
    // Implement Bayesian optimization for model selection
    const selectedModels: string[] = [];
    const params = this.optimizationConfig.modelSelection.params;

    // Get performance history for each model
    const modelPerformances = Array.from(this.modelPerformance.entries()).map(([model, metrics]) => ({
      model,
      meanPerformance: metrics.recentPerformance.reduce((a, b) => a + b, 0) / metrics.recentPerformance.length,
      stdPerformance: Math.sqrt(
        metrics.recentPerformance.reduce((a, b) => a + Math.pow(b - metrics.recentPerformance.reduce((c, d) => c + d, 0) / metrics.recentPerformance.length, 2), 0) / metrics.recentPerformance.length
      )
    }));

    // Select models using Upper Confidence Bound
    const sortedModels = modelPerformances
      .map(({ model, meanPerformance, stdPerformance }) => ({
        model,
        ucb: meanPerformance + params.explorationRate * stdPerformance
      }))
      .sort((a, b) => b.ucb - a.ucb);

    return sortedModels.slice(0, 3).map(m => m.model);
  }

  private async geneticModelSelection(): Promise<string[]> {
    // Implement genetic algorithm for model selection
    return [];
  }

  private async thompsonSamplingSelection(): Promise<string[]> {
    // Implement Thompson sampling for model selection
    return [];
  }

  private async updateModelWeights(): Promise<void> {
    const selectedModels = await this.selectOptimalModels();
    
    switch (this.optimizationConfig.ensembleWeights.method) {
      case 'dynamic':
        await this.updateDynamicWeights(selectedModels);
        break;
      case 'adaptive':
        await this.updateAdaptiveWeights(selectedModels);
        break;
      case 'static':
        await this.updateStaticWeights(selectedModels);
        break;
    }
  }

  private async updateDynamicWeights(selectedModels: string[]): Promise<void> {
    // Implement dynamic weight updating based on recent performance
    const totalPerformance = selectedModels.reduce((sum, model) => {
      const metrics = this.modelPerformance.get(model);
      return sum + (metrics?.accuracy || 0);
    }, 0);

    selectedModels.forEach(model => {
      const metrics = this.modelPerformance.get(model);
      if (metrics) {
        const weight = metrics.accuracy / totalPerformance;
        this.modelWeights.set(model, Math.max(weight, this.optimizationConfig.ensembleWeights.minWeight));
      }
    });
  }

  private async updateAdaptiveWeights(selectedModels: string[]): Promise<void> {
    // Implement adaptive weight updating using online learning
    const learningRate = 0.01;
    
    selectedModels.forEach(model => {
      const metrics = this.modelPerformance.get(model);
      if (metrics) {
        const currentWeight = this.modelWeights.get(model) || 0;
        const performanceDelta = metrics.recentPerformance[metrics.recentPerformance.length - 1] - 
                               metrics.recentPerformance[metrics.recentPerformance.length - 2];
        
        const newWeight = currentWeight + learningRate * performanceDelta;
        this.modelWeights.set(model, Math.max(newWeight, this.optimizationConfig.ensembleWeights.minWeight));
      }
    });

    // Normalize weights
    const totalWeight = Array.from(this.modelWeights.values()).reduce((a, b) => a + b, 0);
    this.modelWeights.forEach((weight, model) => {
      this.modelWeights.set(model, weight / totalWeight);
    });
  }

  private async updateStaticWeights(selectedModels: string[]): Promise<void> {
    // Implement static weight updating based on historical performance
    const weights = new Map<string, number>();
    const equalWeight = 1 / selectedModels.length;
    
    selectedModels.forEach(model => {
      weights.set(model, equalWeight);
    });

    this.modelWeights = weights;
  }

  public async getOptimizedPrediction(eventData: any): Promise<OptimizedPrediction> {
    try {
      // Select optimal models
      const selectedModels = await this.selectOptimalModels();

      // Generate features
      const features = await featureEngineeringService.engineerFeatures(eventData, {
        type: 'aggregation',
        params: {
          windowSize: 10
        }
      });

      // Get predictions from selected models
      const predictions = await Promise.all(
        selectedModels.map(async model => {
          let prediction;
          switch (model) {
            case 'basic':
              prediction = await mlService.getPrediction(eventData);
              break;
            case 'advanced':
              prediction = await advancedMLService.getEnsemblePrediction(eventData);
              break;
            case 'timeSeries':
              prediction = await timeSeriesService.forecast('arima', 1);
              break;
            default:
              prediction = await mlService.getPrediction(eventData);
          }
          return { model, prediction };
        })
      );

      // Combine predictions using current weights
      const weightedPrediction = this.combineWeightedPredictions(predictions);

      // Assess risk
      const riskAssessment = await this.assessRisk(weightedPrediction, features);

      // Update model performance
      predictions.forEach(({ model, prediction }) => {
        this.updateModelPerformance(model, prediction, eventData.actualOutcome);
      });

      return {
        prediction: weightedPrediction,
        confidence: this.calculateEnsembleConfidence(predictions),
        riskAssessment,
        insights: {
          modelWeights: Object.fromEntries(this.modelWeights),
          featureImportance: await this.calculateFeatureImportance(features),
          confidenceIntervals: await this.calculateConfidenceIntervals(predictions)
        }
      };
    } catch (error) {
      console.error('Failed to get optimized prediction:', error);
      throw error;
    }
  }

  private combineWeightedPredictions(predictions: any[]): number {
    return predictions.reduce((sum, { model, prediction }) => {
      const weight = this.modelWeights.get(model) || 0;
      return sum + prediction * weight;
    }, 0);
  }

  private calculateEnsembleConfidence(predictions: any[]): number {
    // Calculate confidence based on model agreement and individual confidences
    const confidences = predictions.map(p => p.confidence || 0.5);
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / confidences.length;
    
    return mean * (1 - Math.sqrt(variance));
  }

  private async calculateFeatureImportance(features: any): Promise<Record<string, number>> {
    // Implement feature importance calculation
    return {};
  }

  private async calculateConfidenceIntervals(predictions: any[]): Promise<[number, number]> {
    // Implement confidence interval calculation
    const values = predictions.map(p => p.prediction);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    return [mean - 1.96 * std, mean + 1.96 * std];
  }

  private async assessRisk(prediction: number, features: any): Promise<any> {
    return await riskModelingService.assessRisk(
      {
        prediction,
        features
      },
      {
        modelType: 'winProbability',
        params: {
          confidenceThreshold: 0.7,
          maxRiskPerBet: 0.1
        }
      }
    );
  }

  public async calibrateModels(): Promise<void> {
    try {
      // Calibrate all models
      await Promise.all([
        mlService.retrainModel(),
        advancedMLService.calibrateModels(),
        timeSeriesService.trainTimeSeriesModel('arima', [], {
          modelType: 'arima',
          params: { p: 1, d: 1, q: 1 }
        })
      ]);

      // Update model weights after calibration
      await this.updateModelWeights();
    } catch (error) {
      console.error('Failed to calibrate models:', error);
      throw error;
    }
  }
}

export const predictionOptimizationService = new PredictionOptimizationService(); 