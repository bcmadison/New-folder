import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { useStore } from '@/store';

interface ArbitrageOpportunity {
  id: string;
  event: string;
  market: string;
  selections: {
    name: string;
    bookmaker: string;
    odds: number;
  }[];
  profit: number;
  roi: number;
}

export default function ArbitragePage() {
  const { events } = useStore();
  const [stake, setStake] = useState<string>('100');
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [error, setError] = useState<string>('');

  const calculateArbitrage = () => {
    try {
      const stakeAmount = parseFloat(stake);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        setError('Please enter a valid stake amount');
        return;
      }

      // Mock data for demonstration
      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          id: '1',
          event: 'Lakers vs Warriors',
          market: 'Moneyline',
          selections: [
            { name: 'Lakers', bookmaker: 'Bet365', odds: 2.1 },
            { name: 'Warriors', bookmaker: 'DraftKings', odds: 2.05 },
          ],
          profit: 2.5,
          roi: 2.5,
        },
        {
          id: '2',
          event: 'Chiefs vs 49ers',
          market: 'Spread',
          selections: [
            { name: 'Chiefs -3.5', bookmaker: 'FanDuel', odds: 1.95 },
            { name: '49ers +3.5', bookmaker: 'BetMGM', odds: 1.98 },
          ],
          profit: 1.8,
          roi: 1.8,
        },
      ];

      setOpportunities(mockOpportunities);
      setError('');
    } catch (err) {
      setError('Failed to calculate arbitrage opportunities');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Arbitrage Calculator
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Calculate Arbitrage
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Total Stake"
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={calculateArbitrage}
                  sx={{ minWidth: 120 }}
                >
                  Calculate
                </Button>
              </Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Arbitrage Opportunities
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event</TableCell>
                      <TableCell>Market</TableCell>
                      <TableCell>Selection</TableCell>
                      <TableCell>Bookmaker</TableCell>
                      <TableCell>Odds</TableCell>
                      <TableCell>Stake</TableCell>
                      <TableCell>Profit</TableCell>
                      <TableCell>ROI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {opportunities.map((opportunity) => (
                      <TableRow key={opportunity.id}>
                        <TableCell rowSpan={2}>{opportunity.event}</TableCell>
                        <TableCell rowSpan={2}>{opportunity.market}</TableCell>
                        {opportunity.selections.map((selection, index) => (
                          <React.Fragment key={selection.bookmaker}>
                            {index === 0 && (
                              <>
                                <TableCell>{selection.name}</TableCell>
                                <TableCell>{selection.bookmaker}</TableCell>
                                <TableCell>{selection.odds}</TableCell>
                                <TableCell>
                                  ${(
                                    (parseFloat(stake) * selection.odds) /
                                    opportunity.selections.reduce(
                                      (sum, s) => sum + 1 / s.odds,
                                      0
                                    )
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell rowSpan={2}>
                                  ${opportunity.profit.toFixed(2)}
                                </TableCell>
                                <TableCell rowSpan={2}>
                                  {opportunity.roi.toFixed(1)}%
                                </TableCell>
                              </>
                            )}
                            {index === 1 && (
                              <>
                                <TableCell>{selection.name}</TableCell>
                                <TableCell>{selection.bookmaker}</TableCell>
                                <TableCell>{selection.odds}</TableCell>
                                <TableCell>
                                  ${(
                                    (parseFloat(stake) * selection.odds) /
                                    opportunity.selections.reduce(
                                      (sum, s) => sum + 1 / s.odds,
                                      0
                                    )
                                  ).toFixed(2)}
                                </TableCell>
                              </>
                            )}
                          </React.Fragment>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 