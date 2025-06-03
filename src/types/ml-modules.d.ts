declare module 'ml-svm' {
  export class SVC {
    constructor(options?: {
      C?: number;
      kernel?: 'linear' | 'rbf' | 'poly';
      gamma?: number | 'scale' | 'auto';
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
    predictProbability(features: number[]): number[];
  }
}

declare module 'ml-knn' {
  export class KNN {
    constructor(options?: {
      k?: number;
      distance?: 'euclidean' | 'manhattan' | 'cosine';
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
    predictProbability(features: number[]): number[];
  }
}

declare module 'ml-naivebayes' {
  export class GaussianNB {
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
    predictProbability(features: number[]): number[];
  }
}

declare module 'ml-xgboost' {
  export class XGBoost {
    constructor(options?: {
      maxDepth?: number;
      learningRate?: number;
      nEstimators?: number;
      objective?: string;
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
    predictProbability(features: number[]): number[];
  }
}

declare module 'ml-random-forest' {
  export class RandomForestClassifier {
    constructor(options?: {
      nEstimators?: number;
      maxDepth?: number;
      minSamplesSplit?: number;
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
    predictProbabilities(features: number[]): number[];
  }
} 