import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { strategyService } from '@/services/strategy';
import { StrategyAutomationToggle } from '@/components/StrategyAutomationToggle';

export const StrategiesPage: React.FC = () => {
  const strategies = strategyService.getAllStrategies();

  return (
    <Grid container spacing={2}>
      {strategies.map(strategy => (
        <Grid item xs={12} md={6} key={strategy.name}>
          <Card>
            <CardContent>
              <Typography variant="h6">{strategy.name}</Typography>
              <Typography variant="body2" color="textSecondary">{strategy.description}</Typography>
              <StrategyAutomationToggle strategyName={strategy.name} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}; 