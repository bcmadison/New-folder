import { PredictionInput, PredictionOutput, PredictionModel, MoneyMakerOpportunity, LineupBuilderOutput, LineupBuilderStrategy, MoneyMakerLeg } from '@/types/predictions';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';

class PredictionService {
  private models: Map<string, PredictionModel> = new Map();
  private activePredictions: Map<string, PredictionOutput> = new Map();
  private opportunityCache: Map<string, MoneyMakerOpportunity> = new Map();
  private modelTypes = [
    'lightgbm',
    'xgboost',
    'catboost',
    'random_forest',
    'stacked_ensemble',
    'online_learner',
    'logistic_regression',
    'mlp_neural_net',
    'lstm',
    'gru',
    'autoencoder',
    'transformer',
    'prophet',
    'holt_winters',
    'arima',
    'kalman_filter',
    'garch',
    'q_learning',
    'ppo',
  ];

  constructor() {
    this.initializeModels();
    this.setupWebSocketListeners();
  }

  private async initializeModels() {
    try {
      const models = await apiService.get<PredictionModel[]>('/models');
      models.forEach((model: PredictionModel) => this.models.set(model.id, model));
    } catch (error) {
      console.error('Failed to initialize prediction models:', error);
    }
  }

  private setupWebSocketListeners() {
    websocketService.subscribe('model_update', (data: PredictionModel) => {
      this.models.set(data.id, data);
    });

    websocketService.subscribe('prediction_update', (data: PredictionOutput) => {
      this.activePredictions.set(data.predictionId, data);
      this.updateOpportunities(data);
    });

    websocketService.subscribe('odds_update', (data: any) => {
      this.updateOpportunitiesWithNewOdds(data);
    });
  }

  async getPrediction(input: PredictionInput): Promise<PredictionOutput> {
    try {
      const response = await apiService.post<PredictionOutput>('/predictions', input);
      this.activePredictions.set(response.predictionId, response);
      return response;
    } catch (error) {
      console.error('Failed to get prediction:', error);
      throw error;
    }
  }

  async findMoneyMakerOpportunities(params: {
    timeWindow: { start: string; end: string };
    minConfidence: number;
    maxLegs: number;
    minLegs: number;
  }): Promise<MoneyMakerOpportunity[]> {
    try {
      const response = await apiService.post<MoneyMakerOpportunity[]>('/opportunities/money-maker', params);
      response.forEach((opp: MoneyMakerOpportunity) => this.opportunityCache.set(opp.id, opp));
      return response;
    } catch (error) {
      console.error('Failed to find Money Maker opportunities:', error);
      throw error;
    }
  }

  async generateLineup(strategy: LineupBuilderStrategy): Promise<LineupBuilderOutput> {
    try {
      const response = await apiService.post<LineupBuilderOutput>('/lineup-builder/generate', strategy);
      return response;
    } catch (error) {
      console.error('Failed to generate lineup:', error);
      throw error;
    }
  }

  async getModelPerformance(modelId: string): Promise<{
    accuracy: number;
    profitLoss: number;
    sampleSize: number;
  }> {
    try {
      return await apiService.get(`/models/${modelId}/performance`);
    } catch (error) {
      console.error('Failed to get model performance:', error);
      throw error;
    }
  }

  async getShapValues(predictionId: string): Promise<{
    featureImportance: Record<string, number>;
    expectedValue: number;
  }> {
    try {
      return await apiService.get(`/predictions/${predictionId}/shap`);
    } catch (error) {
      console.error('Failed to get SHAP values:', error);
      throw error;
    }
  }

  private updateOpportunities(prediction: PredictionOutput) {
    this.opportunityCache.forEach((opportunity, id) => {
      const updatedLegs = opportunity.legs.map(leg => {
        if (leg.prediction.predictionId === prediction.predictionId) {
          return { ...leg, prediction };
        }
        return leg;
      });

      const updatedOpportunity = {
        ...opportunity,
        legs: updatedLegs,
        confidence: this.calculateOpportunityConfidence(updatedLegs),
        expectedValue: this.calculateOpportunityExpectedValue(updatedLegs),
        riskMetrics: this.calculateOpportunityRiskMetrics(updatedLegs),
      };

      this.opportunityCache.set(id, updatedOpportunity);
    });
  }

  private updateOpportunitiesWithNewOdds(oddsUpdate: any) {
    this.opportunityCache.forEach((opportunity, id) => {
      const updatedLegs = opportunity.legs.map(leg => {
        if (leg.eventId === oddsUpdate.eventId && leg.propType === oddsUpdate.propType) {
          return { ...leg, odds: oddsUpdate.newOdds };
        }
        return leg;
      });

      const updatedOpportunity = {
        ...opportunity,
        legs: updatedLegs,
        expectedValue: this.calculateOpportunityExpectedValue(updatedLegs),
        riskMetrics: this.calculateOpportunityRiskMetrics(updatedLegs),
      };

      this.opportunityCache.set(id, updatedOpportunity);
    });
  }

  private calculateOpportunityConfidence(legs: MoneyMakerLeg[]): number {
    return legs.reduce((acc, leg) => acc * leg.prediction.prediction.confidence, 1);
  }

  private calculateOpportunityExpectedValue(legs: MoneyMakerLeg[]): number {
    return legs.reduce((acc, leg) => {
      const edge = leg.prediction.prediction.edge;
      const stake = leg.prediction.prediction.recommendedStake;
      return acc + (edge * stake);
    }, 0);
  }

  private calculateOpportunityRiskMetrics(legs: MoneyMakerLeg[]): {
    variance: number;
    correlation: number;
    kellyStake: number;
  } {
    return {
      variance: this.calculateVariance(legs),
      correlation: this.calculateCorrelation(legs),
      kellyStake: this.calculateKellyStake(legs),
    };
  }

  private calculateVariance(legs: MoneyMakerLeg[]): number {
    // Implement variance calculation using historical data
    return legs.reduce((acc, leg) => {
      const variance = leg.prediction.riskAnalysis.variance;
      return acc + variance;
    }, 0) / legs.length;
  }

  private calculateCorrelation(legs: MoneyMakerLeg[]): number {
    // Implement correlation calculation using historical data
    return legs.reduce((acc, leg) => {
      const correlation = leg.prediction.riskAnalysis.correlation;
      return acc + correlation;
    }, 0) / legs.length;
  }

  private calculateKellyStake(legs: MoneyMakerLeg[]): number {
    // Implement Kelly Criterion calculation
    return legs.reduce((acc, leg) => {
      const kelly = leg.prediction.prediction.kellyFraction;
      return acc + kelly;
    }, 0) / legs.length;
  }
}

export const predictionService = new PredictionService(); 