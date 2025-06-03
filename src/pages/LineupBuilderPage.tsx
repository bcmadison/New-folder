import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Slider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LineupBuilderStrategy, LineupBuilderOutput } from '@/types/predictions';
import { LineupLeg, Lineup } from '@/types/lineup';
import { predictionService } from '@/services/prediction';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { usePredictionStore } from '@/store/predictionStore';

const convertToLineup = (output: LineupBuilderOutput): Lineup => ({
  id: output.id,
  timestamp: output.timestamp,
  strategy: output.strategy,
  legs: output.legs.map(leg => ({
    propType: leg.propType,
    line: leg.line.toString(),
    odds: leg.odds,
  })),
  performance: {
    expectedValue: output.performance.expectedValue,
    winProbability: output.performance.winProbability,
    riskScore: output.performance.riskScore,
  },
});

const LineupBuilderPage: React.FC = () => {
  const {
    currentLineup,
    setCurrentLineup,
    savedLineups,
    addSavedLineup,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = usePredictionStore();

  const [strategy, setStrategy] = useState<LineupBuilderStrategy>({
    id: 'default',
    name: 'Default Strategy',
    type: 'balanced',
    targetConfidence: 75,
    maxLegs: 5,
    minLegs: 2,
    maxSameTeam: 2,
    riskProfile: {
      maxVariance: 0.5,
      maxCorrelation: 0.3,
      minExpectedValue: 0.1,
    },
  });

  const handleStrategyTypeChange = (event: SelectChangeEvent) => {
    const type = event.target.value as 'goblin' | 'demon' | 'balanced';
    setStrategy(prev => ({
      ...prev,
      type,
      targetConfidence: type === 'goblin' ? 84 : type === 'demon' ? 65 : 75,
      riskProfile: {
        ...prev.riskProfile,
        maxVariance: type === 'goblin' ? 0.3 : type === 'demon' ? 0.7 : 0.5,
        minExpectedValue: type === 'goblin' ? 0.15 : type === 'demon' ? 0.05 : 0.1,
      },
    }));
  };

  const handleConfidenceChange = (_: Event, value: number | number[]) => {
    setStrategy(prev => ({
      ...prev,
      targetConfidence: value as number,
    }));
  };

  const handleLegsChange = (event: SelectChangeEvent) => {
    const [min, max] = (event.target.value as string).split('-').map(Number);
    setStrategy(prev => ({
      ...prev,
      minLegs: min,
      maxLegs: max,
    }));
  };

  const handleSameTeamChange = (event: SelectChangeEvent) => {
    setStrategy(prev => ({
      ...prev,
      maxSameTeam: Number(event.target.value),
    }));
  };

  const generateLineup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await predictionService.generateLineup(strategy);
      setCurrentLineup(convertToLineup(result));
    } catch (error) {
      console.error('Failed to generate lineup:', error);
      setError('Failed to generate lineup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLineup = () => {
    if (currentLineup) {
      addSavedLineup(currentLineup);
    }
  };

  const handlePlaceLineup = () => {
    // Implement lineup placement logic
    console.log('Placing lineup:', currentLineup);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Lineup Builder
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Strategy Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={strategy.type}
                  label="Strategy Type"
                  onChange={handleStrategyTypeChange}
                >
                  <MenuItem value="goblin">Goblin (Conservative)</MenuItem>
                  <MenuItem value="demon">Demon (Aggressive)</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Target Confidence</Typography>
              <Slider
                value={strategy.targetConfidence}
                onChange={handleConfidenceChange}
                min={50}
                max={95}
                valueLabelDisplay="auto"
                valueLabelFormat={value => `${value}%`}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Number of Legs</InputLabel>
                <Select
                  value={`${strategy.minLegs}-${strategy.maxLegs}`}
                  label="Number of Legs"
                  onChange={handleLegsChange}
                >
                  <MenuItem value="2-3">2-3 Legs</MenuItem>
                  <MenuItem value="3-4">3-4 Legs</MenuItem>
                  <MenuItem value="4-5">4-5 Legs</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Max Same Team</InputLabel>
                <Select
                  value={strategy.maxSameTeam.toString()}
                  label="Max Same Team"
                  onChange={handleSameTeamChange}
                >
                  <MenuItem value="1">1 Player</MenuItem>
                  <MenuItem value="2">2 Players</MenuItem>
                  <MenuItem value="3">3 Players</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            onClick={generateLineup}
            disabled={isLoading}
          >
            Generate Lineup
          </Button>
        </CardContent>
      </Card>

      {/* Generated Lineup */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : currentLineup ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Generated Lineup
              </Typography>
              <Chip
                label={`${formatPercentage(currentLineup.performance.winProbability)} Win Probability`}
                color={currentLineup.performance.winProbability >= 80 ? 'success' : 'warning'}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Expected Value: {formatCurrency(currentLineup.performance.expectedValue)}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Props:
              </Typography>
              {currentLineup.legs.map((leg: LineupLeg, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {leg.propType} - {leg.line} ({formatCurrency(leg.odds)})
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Risk Analysis:
              </Typography>
              <Typography variant="body2">
                Risk Score: {currentLineup.performance.riskScore.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePlaceLineup}
              >
                Place Lineup
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleSaveLineup}
              >
                Save Lineup
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {/* Saved Lineups */}
      {savedLineups.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Saved Lineups
          </Typography>
          <Grid container spacing={3}>
            {savedLineups.map((lineup: Lineup) => (
              <Grid item xs={12} md={6} lg={4} key={lineup.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        {lineup.strategy.name}
                      </Typography>
                      <Chip
                        label={`${formatPercentage(lineup.performance.winProbability)} Win Probability`}
                        color={lineup.performance.winProbability >= 80 ? 'success' : 'warning'}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Expected Value: {formatCurrency(lineup.performance.expectedValue)}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Props:
                      </Typography>
                      {lineup.legs.map((leg: LineupLeg, index: number) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            {leg.propType} - {leg.line} ({formatCurrency(leg.odds)})
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => setCurrentLineup(lineup)}
                    >
                      Load Lineup
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default LineupBuilderPage;