import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API endpoints
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      })
    );
  }),

  // Predictions endpoints
  rest.get('/api/predictions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          predictions: [
            {
              id: '1',
              playerId: '1',
              sport: 'NBA',
              predictedValue: 25.5,
              confidence: 0.85,
              factors: [
                {
                  name: 'recent_form',
                  weight: 0.6,
                  value: 0.8,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
        status: 'success',
        message: 'Predictions retrieved successfully',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // Lineups endpoints
  rest.post('/api/lineups', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: '1',
          legs: [
            {
              playerId: '1',
              lineId: '1',
              type: 'OVER',
              value: 25.5,
              odds: 1.91,
            },
          ],
          totalOdds: 1.91,
          potentialPayout: 19.10,
          confidence: 0.85,
          createdAt: new Date().toISOString(),
        },
        status: 'success',
        message: 'Lineup created successfully',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // Players endpoints
  rest.get('/api/players/:id/stats', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: req.params.id,
          name: 'Test Player',
          team: 'Test Team',
          sport: 'NBA',
          stats: {
            gamesPlayed: 10,
            averagePoints: 25.5,
            averageRebounds: 7.2,
            averageAssists: 5.1,
          },
          status: {
            isActive: true,
            injuryStatus: null,
            lastUpdated: new Date().toISOString(),
          },
        },
        status: 'success',
        message: 'Player stats retrieved successfully',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // Health check endpoint
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        services: {
          data_service: true,
          websocket_service: true,
          ml_service: true,
          prediction_engine: true,
        },
      })
    );
  }),
];

export const server = setupServer(...handlers); 