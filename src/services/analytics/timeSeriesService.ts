import * as tf from '@tensorflow/tfjs';
import * as statsmodels from 'statsmodels';

interface TimeSeriesConfig {
  modelType: 'arima' | 'sarima' | 'exponentialSmoothing' | 'holtWinters' | 'kalmanFilter' | 'var' | 'garch';
  params: {
    p?: number; // AR order
    d?: number; // Difference order
    q?: number; // MA order
    seasonal?: {
      P?: number; // Seasonal AR order
      D?: number; // Seasonal difference order
      Q?: number; // Seasonal MA order
      m?: number; // Seasonal period
    };
    alpha?: number; // Smoothing factor
    beta?: number; // Trend factor
    gamma?: number; // Seasonal factor
    stateSize?: number; // For Kalman Filter
  };
  trainingConfig: {
    windowSize: number;
    horizon: number;
    validationSplit: number;
  };
}

interface ProbabilisticConfig {
  modelType: 'monteCarlo' | 'hmm' | 'mcmc' | 'cox' | 'kaplanMeier' | 'glm' | 'gam';
  params: {
    iterations?: number;
    burnIn?: number;
    nStates?: number;
    nComponents?: number;
    distribution?: string;
    link?: string;
  };
}

interface TimeSeriesMetrics {
  mse: number;
  mae: number;
  mape: number;
  r2: number;
  aic: number;
  bic: number;
  logLikelihood: number;
}

interface DeepTimeSeriesConfig {
  architecture: 'seq2seq' | 'wavenet' | 'nbeats' | 'tft';
  params: {
    inputWindow: number;
    outputWindow: number;
    hiddenUnits: number[];
    dropout: number;
    attentionHeads?: number;
  };
}

interface HybridModelConfig {
  models: string[];
  weights?: number[];
  ensembleMethod: 'average' | 'weighted' | 'stacking';
}

class TimeSeriesService {
  private timeSeriesModels: Map<string, any> = new Map();
  private probabilisticModels: Map<string, any> = new Map();
  private deepTimeSeriesModels: Map<string, any> = new Map();
  private hybridModels: Map<string, any> = new Map();

  constructor() {
    this.initializeTimeSeriesModels();
    this.initializeProbabilisticModels();
  }

  private async initializeTimeSeriesModels() {
    // Initialize ARIMA
    this.timeSeriesModels.set('arima', {
      type: 'arima',
      params: { p: 1, d: 1, q: 1 }
    });

    // Initialize SARIMA
    this.timeSeriesModels.set('sarima', {
      type: 'sarima',
      params: {
        p: 1,
        d: 1,
        q: 1,
        seasonal: { P: 1, D: 1, Q: 1, m: 12 }
      }
    });

    // Initialize Exponential Smoothing
    this.timeSeriesModels.set('exponentialSmoothing', {
      type: 'exponentialSmoothing',
      params: { alpha: 0.2 }
    });

    // Initialize Holt-Winters
    this.timeSeriesModels.set('holtWinters', {
      type: 'holtWinters',
      params: { alpha: 0.2, beta: 0.1, gamma: 0.1 }
    });

    // Initialize Kalman Filter
    this.timeSeriesModels.set('kalmanFilter', {
      type: 'kalmanFilter',
      params: { stateSize: 2 }
    });

    // Initialize VAR
    this.timeSeriesModels.set('var', {
      type: 'var',
      params: { p: 2 }
    });

    // Initialize GARCH
    this.timeSeriesModels.set('garch', {
      type: 'garch',
      params: { p: 1, q: 1 }
    });

    // Initialize Deep Time Series Models
    await this.initializeDeepTimeSeriesModels();
    
    // Initialize Hybrid Models
    await this.initializeHybridModels();
  }

  private async initializeProbabilisticModels() {
    // Initialize Monte Carlo
    this.probabilisticModels.set('monteCarlo', {
      type: 'monteCarlo',
      params: { iterations: 10000 }
    });

    // Initialize HMM
    this.probabilisticModels.set('hmm', {
      type: 'hmm',
      params: { nStates: 3, nComponents: 2 }
    });

    // Initialize MCMC
    this.probabilisticModels.set('mcmc', {
      type: 'mcmc',
      params: { iterations: 5000, burnIn: 1000 }
    });

    // Initialize Cox Proportional Hazards
    this.probabilisticModels.set('cox', {
      type: 'cox',
      params: {}
    });

    // Initialize Kaplan-Meier
    this.probabilisticModels.set('kaplanMeier', {
      type: 'kaplanMeier',
      params: {}
    });

    // Initialize GLM
    this.probabilisticModels.set('glm', {
      type: 'glm',
      params: {
        distribution: 'gaussian',
        link: 'identity'
      }
    });

    // Initialize GAM
    this.probabilisticModels.set('gam', {
      type: 'gam',
      params: {
        distribution: 'gaussian',
        link: 'identity'
      }
    });
  }

  private async initializeDeepTimeSeriesModels() {
    // Sequence-to-Sequence Model
    this.deepTimeSeriesModels.set('seq2seq', tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [50, 100]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false
        }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10 }) // Output window size
      ]
    }));

    // WaveNet-style Model
    this.deepTimeSeriesModels.set('wavenet', tf.sequential({
      layers: [
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 2,
          dilation: 1,
          activation: 'relu',
          inputShape: [50, 100]
        }),
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 2,
          dilation: 2,
          activation: 'relu'
        }),
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 2,
          dilation: 4,
          activation: 'relu'
        }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10 })
      ]
    }));

    // N-BEATS Model (simplified version)
    this.deepTimeSeriesModels.set('nbeats', this.createNBeatsModel());

    // Temporal Fusion Transformer
    this.deepTimeSeriesModels.set('tft', this.createTemporalFusionTransformer());
  }

  private createNBeatsModel(): tf.LayersModel {
    const stack1 = this.createNBeatsStack(4);
    const stack2 = this.createNBeatsStack(4);
    const stack3 = this.createNBeatsStack(4);

    const input = tf.input({ shape: [50, 100] });
    let x = input;
    
    x = stack1.apply(x) as tf.SymbolicTensor;
    x = stack2.apply(x) as tf.SymbolicTensor;
    x = stack3.apply(x) as tf.SymbolicTensor;
    
    const output = tf.layers.dense({ units: 10 }).apply(x) as tf.SymbolicTensor;
    
    return tf.model({ inputs: input, outputs: output });
  }

  private createNBeatsStack(blocks: number): tf.Sequential {
    const stack = tf.sequential();
    
    for (let i = 0; i < blocks; i++) {
      stack.add(tf.layers.dense({ units: 256, activation: 'relu' }));
      stack.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    }
    
    return stack;
  }

  private createTemporalFusionTransformer(): tf.LayersModel {
    const input = tf.input({ shape: [50, 100] });
    
    // Variable selection networks
    let x = tf.layers.dense({ units: 512, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    
    // Static covariate encoders
    const staticContext = tf.layers.dense({ units: 256, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    
    // Temporal processing
    x = tf.layers.lstm({ units: 128, returnSequences: true }).apply(x) as tf.SymbolicTensor;
    
    // Self-attention
    x = tf.layers.multiHeadAttention({
      numHeads: 4,
      keyDim: 32
    }).apply([x, x, x]) as tf.SymbolicTensor;
    
    // Position-wise feed-forward
    x = tf.layers.dense({ units: 256, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 128, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    
    // Output
    const output = tf.layers.dense({ units: 10 }).apply(x) as tf.SymbolicTensor;
    
    return tf.model({ inputs: input, outputs: output });
  }

  private async initializeHybridModels() {
    // ARIMA + LSTM Hybrid
    this.hybridModels.set('arima_lstm', {
      models: ['arima', 'lstm'],
      weights: [0.5, 0.5],
      ensembleMethod: 'weighted'
    });

    // Prophet + WaveNet Hybrid
    this.hybridModels.set('prophet_wavenet', {
      models: ['prophet', 'wavenet'],
      weights: [0.4, 0.6],
      ensembleMethod: 'weighted'
    });

    // Comprehensive Ensemble
    this.hybridModels.set('comprehensive', {
      models: ['arima', 'prophet', 'lstm', 'wavenet', 'nbeats'],
      ensembleMethod: 'stacking'
    });
  }

  public async trainTimeSeriesModel(
    modelType: string,
    data: number[][],
    config: Partial<TimeSeriesConfig> = {}
  ): Promise<void> {
    const model = this.timeSeriesModels.get(modelType);
    if (!model) {
      throw new Error(`Time series model ${modelType} not found`);
    }

    try {
      await this.trainModel(model, data, config);
    } catch (error) {
      console.error(`Error training ${modelType} model:`, error);
      throw error;
    }
  }

  private async trainModel(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    switch (model.type) {
      case 'arima':
        await this.trainARIMA(model, data, config);
        break;
      case 'sarima':
        await this.trainSARIMA(model, data, config);
        break;
      case 'exponentialSmoothing':
        await this.trainExponentialSmoothing(model, data, config);
        break;
      case 'holtWinters':
        await this.trainHoltWinters(model, data, config);
        break;
      case 'kalmanFilter':
        await this.trainKalmanFilter(model, data, config);
        break;
      case 'var':
        await this.trainVAR(model, data, config);
        break;
      case 'garch':
        await this.trainGARCH(model, data, config);
        break;
      default:
        throw new Error(`Training not implemented for ${model.type}`);
    }
  }

  private async trainARIMA(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement ARIMA training
  }

  private async trainSARIMA(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement SARIMA training
  }

  private async trainExponentialSmoothing(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement Exponential Smoothing training
  }

  private async trainHoltWinters(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement Holt-Winters training
  }

  private async trainKalmanFilter(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement Kalman Filter training
  }

  private async trainVAR(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement VAR training
  }

  private async trainGARCH(
    model: any,
    data: number[][],
    config: Partial<TimeSeriesConfig>
  ): Promise<void> {
    // Implement GARCH training
  }

  public async trainProbabilisticModel(
    modelType: string,
    data: any,
    config: Partial<ProbabilisticConfig> = {}
  ): Promise<void> {
    const model = this.probabilisticModels.get(modelType);
    if (!model) {
      throw new Error(`Probabilistic model ${modelType} not found`);
    }

    try {
      await this.trainProbabilistic(model, data, config);
    } catch (error) {
      console.error(`Error training ${modelType} model:`, error);
      throw error;
    }
  }

  private async trainProbabilistic(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    switch (model.type) {
      case 'monteCarlo':
        await this.trainMonteCarlo(model, data, config);
        break;
      case 'hmm':
        await this.trainHMM(model, data, config);
        break;
      case 'mcmc':
        await this.trainMCMC(model, data, config);
        break;
      case 'cox':
        await this.trainCox(model, data, config);
        break;
      case 'kaplanMeier':
        await this.trainKaplanMeier(model, data, config);
        break;
      case 'glm':
        await this.trainGLM(model, data, config);
        break;
      case 'gam':
        await this.trainGAM(model, data, config);
        break;
      default:
        throw new Error(`Training not implemented for ${model.type}`);
    }
  }

  private async trainMonteCarlo(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement Monte Carlo training
  }

  private async trainHMM(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement HMM training
  }

  private async trainMCMC(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement MCMC training
  }

  private async trainCox(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement Cox training
  }

  private async trainKaplanMeier(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement Kaplan-Meier training
  }

  private async trainGLM(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement GLM training
  }

  private async trainGAM(
    model: any,
    data: any,
    config: Partial<ProbabilisticConfig>
  ): Promise<void> {
    // Implement GAM training
  }

  public async forecast(
    modelType: string,
    horizon: number,
    config: any = {}
  ): Promise<number[]> {
    const model = this.timeSeriesModels.get(modelType);
    if (!model) {
      throw new Error(`Time series model ${modelType} not found`);
    }

    try {
      return await this.generateForecast(model, horizon, config);
    } catch (error) {
      console.error(`Error forecasting with ${modelType}:`, error);
      throw error;
    }
  }

  private async generateForecast(
    model: any,
    horizon: number,
    config: any
  ): Promise<number[]> {
    switch (model.type) {
      case 'arima':
        return this.forecastARIMA(model, horizon, config);
      case 'sarima':
        return this.forecastSARIMA(model, horizon, config);
      case 'exponentialSmoothing':
        return this.forecastExponentialSmoothing(model, horizon, config);
      case 'holtWinters':
        return this.forecastHoltWinters(model, horizon, config);
      case 'kalmanFilter':
        return this.forecastKalmanFilter(model, horizon, config);
      case 'var':
        return this.forecastVAR(model, horizon, config);
      case 'garch':
        return this.forecastGARCH(model, horizon, config);
      default:
        throw new Error(`Forecasting not implemented for ${model.type}`);
    }
  }

  private forecastARIMA(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real ARIMA forecasting logic
    // throw new Error('ARIMA forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastSARIMA(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real SARIMA forecasting logic
    // throw new Error('SARIMA forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastExponentialSmoothing(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real Exponential Smoothing forecasting logic
    // throw new Error('Exponential Smoothing forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastHoltWinters(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real Holt-Winters forecasting logic
    // throw new Error('Holt-Winters forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastKalmanFilter(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real Kalman Filter forecasting logic
    // throw new Error('Kalman Filter forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastVAR(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real VAR forecasting logic
    // throw new Error('VAR forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  private forecastGARCH(model: any, horizon: number, config: any): number[] {
    // TODO: Implement real GARCH forecasting logic
    // throw new Error('GARCH forecasting not implemented');
    return Array(horizon).fill(0); // Scaffold: Replace with real logic
  }

  public async getMetrics(): Promise<TimeSeriesMetrics> {
    try {
      const metrics: TimeSeriesMetrics = {
        mse: 0,
        mae: 0,
        mape: 0,
        r2: 0,
        aic: 0,
        bic: 0,
        logLikelihood: 0
      };

      // Calculate metrics for each model type
      for (const [modelType, model] of this.timeSeriesModels.entries()) {
        const modelMetrics = await this.calculateModelMetrics(model);
        metrics.mse += modelMetrics.mse;
        metrics.mae += modelMetrics.mae;
        metrics.mape += modelMetrics.mape;
        metrics.r2 += modelMetrics.r2;
        metrics.aic += modelMetrics.aic;
        metrics.bic += modelMetrics.bic;
        metrics.logLikelihood += modelMetrics.logLikelihood;
      }

      // Average metrics across all models
      const numModels = this.timeSeriesModels.size;
      Object.keys(metrics).forEach(key => {
        metrics[key as keyof TimeSeriesMetrics] /= numModels;
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get time series metrics:', error);
      throw error;
    }
  }

  private async calculateModelMetrics(model: any): Promise<TimeSeriesMetrics> {
    switch (model.type) {
      case 'arima':
        return this.calculateArimaMetrics(model);
      case 'sarima':
        return this.calculateSarimaMetrics(model);
      case 'exponentialSmoothing':
        return this.calculateExponentialSmoothingMetrics(model);
      case 'holtWinters':
        return this.calculateHoltWintersMetrics(model);
      case 'kalmanFilter':
        return this.calculateKalmanFilterMetrics(model);
      case 'var':
        return this.calculateVarMetrics(model);
      case 'garch':
        return this.calculateGarchMetrics(model);
      default:
        throw new Error(`Metrics calculation not implemented for ${model.type}`);
    }
  }

  private async calculateArimaMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement ARIMA metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateSarimaMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement SARIMA metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateExponentialSmoothingMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement Exponential Smoothing metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateHoltWintersMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement Holt-Winters metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateKalmanFilterMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement Kalman Filter metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateVarMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement VAR metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  private async calculateGarchMetrics(model: any): Promise<TimeSeriesMetrics> {
    // Implement GARCH metrics calculation
    return {
      mse: 0,
      mae: 0,
      mape: 0,
      r2: 0,
      aic: 0,
      bic: 0,
      logLikelihood: 0
    };
  }

  public async trainDeepTimeSeriesModel(
    modelType: string,
    data: number[][],
    config: Partial<DeepTimeSeriesConfig> = {}
  ): Promise<tf.History> {
    const model = this.deepTimeSeriesModels.get(modelType);
    if (!model) {
      throw new Error(`Deep time series model ${modelType} not found`);
    }

    try {
      const tensorData = tf.tensor3d(data);
      const history = await model.fit(tensorData, tensorData, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: [
          tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: 10
          })
        ]
      });

      return history;
    } catch (error) {
      console.error(`Error training deep time series model ${modelType}:`, error);
      throw error;
    }
  }

  public async trainHybridModel(
    modelType: string,
    data: number[][],
    config: Partial<HybridModelConfig> = {}
  ): Promise<void> {
    const model = this.hybridModels.get(modelType);
    if (!model) {
      throw new Error(`Hybrid model ${modelType} not found`);
    }

    try {
      // Train individual models
      await Promise.all(
        model.models.map(async (subModel: string) => {
          if (this.timeSeriesModels.has(subModel)) {
            await this.trainTimeSeriesModel(subModel, data, {});
          } else if (this.deepTimeSeriesModels.has(subModel)) {
            await this.trainDeepTimeSeriesModel(subModel, data, {});
          }
        })
      );

      // Train ensemble if using stacking
      if (model.ensembleMethod === 'stacking') {
        await this.trainStackingEnsemble(model, data);
      }
    } catch (error) {
      console.error(`Error training hybrid model ${modelType}:`, error);
      throw error;
    }
  }

  private async trainStackingEnsemble(model: any, data: number[][]): Promise<void> {
    // Implement stacking ensemble training
    // Get predictions from base models
    const basePredictions = await Promise.all(
      model.models.map(async (subModel: string) => {
        return this.forecast(subModel, 10);
      })
    );

    // Create meta-features
    const metaFeatures = tf.tensor2d(basePredictions);

    // Train meta-model (simple neural network)
    const metaModel = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [model.models.length] }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    metaModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    // Train meta-model
    await metaModel.fit(metaFeatures, tf.tensor2d(data.slice(-10)), {
      epochs: 100,
      validationSplit: 0.2
    });

    // Store meta-model
    model.metaModel = metaModel;
  }

  public async forecastWithHybrid(
    modelType: string,
    horizon: number,
    config: any = {}
  ): Promise<number[]> {
    const model = this.hybridModels.get(modelType);
    if (!model) {
      throw new Error(`Hybrid model ${modelType} not found`);
    }

    try {
      // Get predictions from all base models
      const predictions = await Promise.all(
        model.models.map(async (subModel: string) => {
          return this.forecast(subModel, horizon);
        })
      );

      // Combine predictions based on ensemble method
      switch (model.ensembleMethod) {
        case 'average':
          return this.averagePredictions(predictions);
        case 'weighted':
          return this.weightedPredictions(predictions, model.weights);
        case 'stacking':
          return this.stackingPredictions(predictions, model.metaModel);
        default:
          throw new Error(`Ensemble method ${model.ensembleMethod} not supported`);
      }
    } catch (error) {
      console.error(`Error forecasting with hybrid model ${modelType}:`, error);
      throw error;
    }
  }

  private averagePredictions(predictions: number[][]): number[] {
    return predictions[0].map((_, i) =>
      predictions.reduce((sum, pred) => sum + pred[i], 0) / predictions.length
    );
  }

  private weightedPredictions(predictions: number[][], weights: number[]): number[] {
    return predictions[0].map((_, i) =>
      predictions.reduce((sum, pred, j) => sum + pred[i] * weights[j], 0)
    );
  }

  private async stackingPredictions(predictions: number[][], metaModel: tf.LayersModel): Promise<number[]> {
    const metaFeatures = tf.tensor2d(predictions);
    const stackedPrediction = await metaModel.predict(metaFeatures) as tf.Tensor;
    return Array.from(stackedPrediction.dataSync());
  }
}

export const timeSeriesService = new TimeSeriesService(); 