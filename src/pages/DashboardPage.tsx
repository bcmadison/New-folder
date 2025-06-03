import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';
import { BankrollStats } from '@/components/BankrollStats';
import { BettingHistory } from '@/components/BettingHistory';
import { OpportunitiesList } from '@/components/OpportunitiesList';
import { bankrollService } from '@/services/bankroll';
import { notificationService } from '@/services/notification';
import { strategyService } from '@/services/strategy';

export const DashboardPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        setIsLoading(true);
        // Load opportunities from all strategies
        const allOpportunities = await Promise.all(
          strategyService.getAllStrategies().map(async (strategy) => {
            try {
              const bets = await strategyService.executeStrategy(strategy.name);
              return bets.map(bet => ({
                ...bet,
                strategy: strategy.name,
              }));
            } catch (error) {
              console.error(`Error executing strategy ${strategy.name}:`, error);
              return [];
            }
          })
        );

        // Flatten and deduplicate opportunities
        const uniqueOpportunities = Array.from(
          new Map(
            allOpportunities.flat().map(opp => [opp.id, opp])
          ).values()
        );

        setOpportunities(uniqueOpportunities);
      } catch (error) {
        console.error('Error loading opportunities:', error);
        notificationService.notify(
          'error',
          'Error Loading Opportunities',
          'Failed to load betting opportunities. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadOpportunities();
    // Refresh opportunities every 5 minutes
    const interval = setInterval(loadOpportunities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePlaceBet = async (opportunity: any) => {
    try {
      const bet = await bankrollService.placeBet(
        opportunity.stake,
        {
          eventId: opportunity.event.id,
          market: opportunity.market,
          selection: opportunity.selection,
          odds: opportunity.odds,
        }
      );

      notificationService.notify(
        'success',
        'Bet Placed',
        `Successfully placed bet of $${opportunity.stake.toFixed(2)} on ${opportunity.selection}`,
        bet
      );

      // Remove the opportunity from the list
      setOpportunities(prev =>
        prev.filter(opp => opp.id !== opportunity.id)
      );
    } catch (error) {
      console.error('Error placing bet:', error);
      notificationService.notify(
        'error',
        'Error Placing Bet',
        error instanceof Error ? error.message : 'Failed to place bet. Please try again.'
      );
    }
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Typography variant="h4" gutterBottom>
          Betting Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Bankroll Stats */}
          <Grid item xs={12}>
            <BankrollStats />
          </Grid>

          {/* Betting Opportunities */}
          <Grid item xs={12}>
            <OpportunitiesList
              opportunities={opportunities}
              onPlaceBet={handlePlaceBet}
            />
          </Grid>

          {/* Betting History */}
          <Grid item xs={12}>
            <BettingHistory />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 