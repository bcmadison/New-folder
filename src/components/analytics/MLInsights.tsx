import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterPlot,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useMLAnalytics } from '@/hooks/useMLAnalytics';

interface MLInsightsProps {
  config: {
    modelType: string;
    params: Record<string, any>;
    features: any[];
    target?: any[];
  };
}

const MLInsights: React.FC<MLInsightsProps> = ({ config }) => {
  const {
    loading,
    error,
    mlResult,
    riskResult,
    clusteringResult,
    timeSeriesResult,
    refreshAnalysis
  } = useMLAnalytics(config);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error.message}</p>
        <button
          onClick={refreshAnalysis}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ML Predictions Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">ML Predictions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Model Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-mono">{mlResult?.metrics.accuracy.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Precision:</span>
                <span className="font-mono">{mlResult?.metrics.precision.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recall:</span>
                <span className="font-mono">{mlResult?.metrics.recall.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>F1 Score:</span>
                <span className="font-mono">{mlResult?.metrics.f1Score.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Feature Importance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(mlResult?.insights.featureImportance || {})}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="0" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="1" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Risk Analysis Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Risk Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Risk Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>VaR (95%):</span>
                <span className="font-mono">{riskResult?.simulation.var.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>CVaR:</span>
                <span className="font-mono">{riskResult?.simulation.cvar.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sharpe Ratio:</span>
                <span className="font-mono">{riskResult?.simulation.sharpeRatio.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Drawdown:</span>
                <span className="font-mono">{riskResult?.simulation.maxDrawdown.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Return Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={riskResult?.simulation.distribution.map((value, index) => ({ x: index, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" fill="#3B82F6" stroke="#2563EB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Clustering Analysis Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Clustering Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Cluster Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Silhouette Score:</span>
                <span className="font-mono">{clusteringResult?.metrics.silhouetteScore.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Davies-Bouldin Score:</span>
                <span className="font-mono">{clusteringResult?.metrics.daviesBouldinScore.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Calinski-Harabasz Score:</span>
                <span className="font-mono">{clusteringResult?.metrics.calinskiHarabaszScore.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Cluster Visualization</h3>
            {clusteringResult?.embedding && (
              <ResponsiveContainer width="100%" height={200}>
                <ScatterPlot>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="0" />
                  <YAxis dataKey="1" />
                  <Tooltip />
                  <Scatter
                    data={clusteringResult.embedding.map((point, index) => ({
                      x: point[0],
                      y: point[1],
                      cluster: clusteringResult.clusters[index]
                    }))}
                    fill="#3B82F6"
                  />
                </ScatterPlot>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Time Series Analysis Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Time Series Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Forecast Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>MSE:</span>
                <span className="font-mono">{timeSeriesResult?.metrics.mse.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>MAE:</span>
                <span className="font-mono">{timeSeriesResult?.metrics.mae.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>MAPE:</span>
                <span className="font-mono">{timeSeriesResult?.metrics.mape.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>R²:</span>
                <span className="font-mono">{timeSeriesResult?.metrics.r2.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Forecast</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={timeSeriesResult?.forecast.map((value, index) => ({
                  x: index,
                  value,
                  lower: timeSeriesResult.confidence.lower[index],
                  upper: timeSeriesResult.confidence.upper[index]
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" />
                <Line type="monotone" dataKey="lower" stroke="#93C5FD" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="upper" stroke="#93C5FD" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={refreshAnalysis}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default MLInsights; 