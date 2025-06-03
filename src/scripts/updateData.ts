import { DataScrapingService } from '../services/dataScrapingService';
import 'reflect-metadata';

async function main() {
  try {
    const service = DataScrapingService.getInstance();
    console.log('Fetching player data...');
    const data = await service.fetchPlayerData();
    console.log(`Successfully fetched data for ${data.length} players`);
    
    // Log some sample data
    if (data.length > 0) {
      console.log('\nSample player data:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('Error running data update:', error);
  }
}

main(); 