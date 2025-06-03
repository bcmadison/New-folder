import App from '../../App';
import { measurePerformance } from '../performanceMonitor';
import { render, screen } from '@testing-library/react';


test('App loads in under 2 seconds', async () => {
  await measurePerformance(async () => {
    render(<App />);
    await screen.findByText(/Dashboard/i);
  }, 'App initial load');
}); 