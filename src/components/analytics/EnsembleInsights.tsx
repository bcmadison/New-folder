import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EnsembleInsightsProps {
  models: {
    name: string;
    type: string;
    weight: number;
    performance: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    predictions: number[];
    confidence: number[];
  }[];
  ensemble: {
    predictions: number[];
    confidence: number[];
    performance: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    diversity: {
      disagreement: number;
      correlation: number;
      kappa: number;
    };
  };
  calibration: {
    bins: number[];
    observed: number[];
    expected: number[];
  };
}

const EnsembleInsights: React.FC<EnsembleInsightsProps> = ({
  models,
  ensemble,
  calibration
}) => {
  // Colors for different models
  const modelColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#06B6D4'  // Cyan
  ];

  // Prepare data for visualizations
  const modelPerformance = models.map((model) => ({
    name: model.name,
    ...model.performance
  }));

  const modelWeights = models.map((model) => ({
    name: model.name,
    weight: model.weight
  }));

  const calibrationData = calibration.bins.map((bin, index) => ({
    bin,
    observed: calibration.observed[index],
    expected: calibration.expected[index]
  }));

  return (
    <div className="space-y-8">
      {/* Ensemble Performance Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Ensemble Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Accuracy</h3>
            <p className="text-2xl font-bold text-gray-900">
              {(ensemble.performance.accuracy * 100).toFixed(2)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Precision</h3>
            <p className="text-2xl font-bold text-gray-900">
              {(ensemble.performance.precision * 100).toFixed(2)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Recall</h3>
            <p className="text-2xl font-bold text-gray-900">
              {(ensemble.performance.recall * 100).toFixed(2)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">F1 Score</h3>
            <p className="text-2xl font-bold text-gray-900">
              {(ensemble.performance.f1Score * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </section>

      {/* Model Weights Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Model Weights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Weight Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelWeights}
                  dataKey="weight"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {modelWeights.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={modelColors[index % modelColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Model Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#3B82F6" name="Accuracy" />
                <Bar dataKey="f1Score" fill="#10B981" name="F1 Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Model Diversity Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Ensemble Diversity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">
              Disagreement Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {(ensemble.diversity.disagreement * 100).toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500">
              Percentage of predictions where models disagree
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">
              Model Correlation
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {ensemble.diversity.correlation.toFixed(4)}
            </p>
            <p className="text-sm text-gray-500">
              Average correlation between model predictions
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">
              Kappa Statistic
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {ensemble.diversity.kappa.toFixed(4)}
            </p>
            <p className="text-sm text-gray-500">
              Agreement level between models
            </p>
          </div>
        </div>
      </section>

      {/* Calibration Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Model Calibration</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={calibrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bin"
                label={{
                  value: 'Predicted Probability',
                  position: 'bottom'
                }}
              />
              <YAxis
                label={{
                  value: 'Observed Frequency',
                  angle: -90,
                  position: 'left'
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="observed"
                stroke="#3B82F6"
                name="Observed"
                strokeWidth={2}
                dot
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#10B981"
                name="Expected"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Individual Model Details */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Individual Model Details</h2>
        <div className="space-y-6">
          {models.map((model, index) => (
            <div
              key={model.name}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{model.name}</h3>
                  <p className="text-sm text-gray-500">{model.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(model.weight * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Accuracy</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(model.performance.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precision</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(model.performance.precision * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recall</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(model.performance.recall * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">F1 Score</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(model.performance.f1Score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EnsembleInsights; 