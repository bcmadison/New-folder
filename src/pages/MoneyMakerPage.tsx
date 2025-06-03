import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import { MoneyMakerOpportunity } from '@/types/predictions';
import { predictionService } from '@/services/prediction';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { usePredictionStore } from '@/store/predictionStore';

const MoneyMakerPage: React.FC = () => {
  const {
    opportunities,
    setOpportunities,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = usePredictionStore();

  const [filters, setFilters] = useState({
    minConfidence: 75,
    maxLegs: 5,
    minLegs: 2,
    timeWindow: '1h',
  });

  useEffect(() => {
    loadOpportunities();
  }, [filters]);

  const loadOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + getTimeWindowInMs(filters.timeWindow));
      
      const opportunities = await predictionService.findMoneyMakerOpportunities({
        timeWindow: {
          start: now.toISOString(),
          end: end.toISOString(),
        },
        minConfidence: filters.minConfidence,
        maxLegs: filters.maxLegs,
        minLegs: filters.minLegs,
      });
      
      setOpportunities(opportunities);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      setError('Failed to load opportunities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeWindowInMs = (window: string): number => {
    switch (window) {
      case '30m':
        return 30 * 60 * 1000;
      case '1h':
        return 60 * 60 * 1000;
      case '2h':
        return 2 * 60 * 60 * 1000;
      case '4h':
        return 4 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  };

  const handleConfidenceChange = (_: Event, value: number | number[]) => {
    setFilters(prev => ({ ...prev, minConfidence: value as number }));
  };

  const handleTimeWindowChange = (event: SelectChangeEvent) => {
    setFilters(prev => ({ ...prev, timeWindow: event.target.value }));
  };

  const handleLegsChange = (event: SelectChangeEvent) => {
    const [min, max] = (event.target.value as string).split('-').map(Number);
    setFilters(prev => ({ ...prev, minLegs: min, maxLegs: max }));
  };

  const handlePlaceBet = async (opportunity: MoneyMakerOpportunity) => {
    // Implement bet placement logic
    console.log('Placing bet for opportunity:', opportunity);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Money Maker
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Minimum Confidence</Typography>
              <Slider
                value={filters.minConfidence}
                onChange={handleConfidenceChange}
                min={50}
                max={95}
                valueLabelDisplay="auto"
                valueLabelFormat={value => `${value}%`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Window</InputLabel>
                <Select
                  value={filters.timeWindow}
                  label="Time Window"
                  onChange={handleTimeWindowChange}
                >
                  <MenuItem value="30m">30 Minutes</MenuItem>
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="2h">2 Hours</MenuItem>
                  <MenuItem value="4h">4 Hours</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Number of Legs</InputLabel>
                <Select
                  value={`${filters.minLegs}-${filters.maxLegs}`}
                  label="Number of Legs"
                  onChange={handleLegsChange}
                >
                  <MenuItem value="2-3">2-3 Legs</MenuItem>
                  <MenuItem value="3-4">3-4 Legs</MenuItem>
                  <MenuItem value="4-5">4-5 Legs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Opportunities */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {opportunities.map((opportunity) => (
            <Grid item xs={12} md={6} lg={4} key={opportunity.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {opportunity.legs.length} Leg Parlay
                    </Typography>
                    <Chip
                      label={`${formatPercentage(opportunity.confidence)} Confidence`}
                      color={opportunity.confidence >= 80 ? 'success' : 'warning'}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Expected Value: {formatCurrency(opportunity.expectedValue)}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Legs:
                    </Typography>
                    {opportunity.legs.map((leg, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {leg.propType} - {leg.line} ({formatCurrency(leg.odds)})
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Risk Metrics:
                    </Typography>
                    <Typography variant="body2">
                      Variance: {opportunity.riskMetrics.variance.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Correlation: {opportunity.riskMetrics.correlation.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Kelly Stake: {formatCurrency(opportunity.riskMetrics.kellyStake)}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handlePlaceBet(opportunity)}
                  >
                    Place Bet
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MoneyMakerPage; 