import { PerformanceMonitor } from './core/PerformanceMonitor';
import { PredictionEngine } from './core/PredictionEngine';
import { UnifiedMonitor } from './core/UnifiedMonitor';


async function main() {
  try {
    
    const engine = PredictionEngine.getInstance();

    
    await engine.start();

    

    // Example prediction
    const playerProp = {
      id: 'nba-lal-gsw-lebron-points',
      player: {
        id: 'lebron',
        name: 'LeBron James',
        team: {
          id: 'lal',
          name: 'Lakers',
          sport: 'NBA' as const
        }
      },
      type: 'POINTS' as const,
      line: 28.5,
      odds: -110,
      confidence: 0.85,
      timestamp: Date.now()
    };
    const result = await engine.predict(playerProp);

    console.log('Prediction Result:', {
      id: result.id,
      confidence: result.confidence,
      metadata: result.analysis?.meta_analysis
    });

    // Monitor engine metrics
    setInterval(() => {
      const monitor = UnifiedMonitor.getInstance();
      const metrics = monitor.getMetrics('prediction');
      
    }, 60000); // Every minute

  } catch (error) {
    console.error('Error starting Prediction Engine:', error);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
}); 