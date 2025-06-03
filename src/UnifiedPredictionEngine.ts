import { PredictionOutput, PredictionInput } from '../types'; // Using more generic PredictionInput/Output from ../types
import { predictionService, PredictionRequestData } from '../services/predictionService';
import { unifiedMonitor } from './UnifiedMonitor';

// src/core/UnifiedPredictionEngine.ts

// import { unifiedConfig, getUnifiedConfig } from './UnifiedConfig'; // If engine needs config for model IDs, etc.

/**
 * UnifiedPredictionEngine (Client-Side Interface)
 *
 * This client-side engine acts as an interface to backend prediction services.
 * It prepares input data, sends requests to the `predictionService`,
 * and processes the returned predictions.
 *
 * Actual machine learning model execution and complex statistical analysis occur on the BACKEND.
 *
 * Key Client-Side Responsibilities:
 * 1. Define clear interfaces for prediction inputs (features) and outputs (predictions).
 * 2. Provide methods to request predictions for various scenarios (e.g., prop outcome, game score).
 * 3. Handle asynchronous nature of prediction requests (loading states, errors).
 * 4. Potentially format prediction data for display or use by other engines (e.g., StrategyEngine).
 * 5. Manage any client-side caching of predictions if appropriate (though React Query in services can handle this).
 */

class UnifiedPredictionEngineSingleton {

  constructor() {
    
    // Example: Load default model ID or other settings from UnifiedConfig
    // getUnifiedConfig().then(config => {
    //   this.defaultModelId = config.getPredictionEngineSettings()?.defaultModelId;
    // });
  }

  /**
   * Requests a prediction from the backend prediction service.
   * @param input Features and context for the prediction.
   * @param modelId Optional: Specific model to use for this prediction.
   * @returns A promise that resolves to the prediction output, or null if an error occurs.
   */
  public async getPrediction(input: PredictionInput, modelId?: string): Promise<PredictionOutput | null> {
    const trace = unifiedMonitor.startTrace('getPrediction', 'ml.prediction');
    const requestSpan = unifiedMonitor.addSpanToTrace(trace, 'prepare_request', `Prop: ${input.propId}`);
    
    try {
      

      // Map PredictionInput (from ../types) to PredictionRequestData (from predictionService)
      // This mapping depends on how abstract PredictionInput is vs. what the service expects.
      // For this example, assume PredictionInput is a subset or directly usable as features.
      const requestData: PredictionRequestData = {
        features: { ...input }, // Send all input fields as features
        modelId: modelId, // Pass specific modelId if provided
        context: { propId: input.propId } // Add context like propId for backend logging/use
      };
      requestSpan?.finish();

      const serviceCallSpan = unifiedMonitor.addSpanToTrace(trace, 'call_prediction_service', `Prop: ${input.propId}`);
      const prediction = await predictionService.getPrediction(requestData);
      serviceCallSpan?.finish();
      
      // The prediction from the service should already be of type PredictionOutput or similar.
      // If transformation is needed, do it here.
      // Example: const formattedPrediction = this.formatPredictionOutput(prediction);
      
      unifiedMonitor.recordMetric({ name: 'prediction.request.success', value: 1, tags: { modelId: modelId || 'default'} });
      unifiedMonitor.endTrace(trace);
      return prediction;

    } catch (error: any) {
      unifiedMonitor.reportError(error, { 
        operation: 'getPrediction', 
        propId: input.propId, 
        modelId 
      });
      unifiedMonitor.recordMetric({ name: 'prediction.request.failure', value: 1, tags: { modelId: modelId || 'default' } });
      requestSpan?.finish(); // Ensure spans are finished on error too
      unifiedMonitor.endTrace(trace);
      return null;
    }
  }

  /**
   * Fetches detailed information or explanation for a specific prediction, if available.
   * @param predictionId The ID of the prediction to get details for.
   */
  public async getPredictionDetails(predictionId: string): Promise<any | null> {
    const trace = unifiedMonitor.startTrace('getPredictionDetails', 'ml.prediction_details');
    try {
      
      const details = await predictionService.getPredictionDetails(predictionId);
      unifiedMonitor.endTrace(trace);
      return details;
    } catch (error: any) {
      unifiedMonitor.reportError(error, { operation: 'getPredictionDetails', predictionId });
      unifiedMonitor.endTrace(trace);
      return null;
    }
  }

  // private formatPredictionOutput(rawOutput: any): PredictionOutput {
  //   // Transform raw service output to the standardized PredictionOutput if necessary
  //   return rawOutput as PredictionOutput;
  // }
}

// Export a singleton instance
export const unifiedPredictionEngine = new UnifiedPredictionEngineSingleton();

// Example Usage (conceptual):
// const features: PredictionInput = { propId: 'prop123', historicalStats: { avgPoints: 25 }, marketOdds: { over: -110 } };
// unifiedPredictionEngine.getPrediction(features).then(prediction => {
//   if (prediction) {
//     
//   }
// }); 