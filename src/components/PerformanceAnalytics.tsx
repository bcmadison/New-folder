import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { riskManagement } from '@/services/riskManagement';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const AnalyticsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const PerformanceAnalytics: React.FC = () => {
  const [value, setValue] = useState(0);
  const [bankroll, setBankroll] = useState(riskManagement.getBankroll());
  const [bets, setBets] = useState(riskManagement.getBets());

  useEffect(() => {
    const loadData = () => {
      setBankroll(riskManagement.getBankroll());
      setBets(riskManagement.getBets());
    };

    loadData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBankrollHistory = () => {
    return bets.map((bet, index) => ({
      date: new Date(bet.timestamp).toLocaleDateString(),
      bankroll: bankroll.initial + (bet.payout || 0) - bet.amount,
    }));
  };

  const getBetTypeDistribution = () => {
    const distribution = bets.reduce((acc, bet) => {
      acc[bet.type] = (acc[bet.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  };

  const getWinLossByType = () => {
    const data = bets.reduce((acc, bet) => {
      if (!acc[bet.type]) {
        acc[bet.type] = { wins: 0, losses: 0 };
      }
      if (bet.status === 'won') {
        acc[bet.type].wins++;
      } else if (bet.status === 'lost') {
        acc[bet.type].losses++;
      }
      return acc;
    }, {} as Record<string, { wins: number; losses: number }>);

    return Object.entries(data).map(([type, stats]) => ({
      type,
      wins: stats.wins,
      losses: stats.losses,
    }));
  };

  return (
    <AnalyticsCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Analytics
        </Typography>

        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TimelineIcon />} label="Bankroll" />
          <Tab icon={<PieChartIcon />} label="Distribution" />
          <Tab icon={<BarChartIcon />} label="Win/Loss" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getBankrollHistory()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bankroll"
                  stroke="#8884d8"
                  name="Bankroll"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getBetTypeDistribution()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {getBetTypeDistribution().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getWinLossByType()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="wins" name="Wins" fill="#4caf50" />
                <Bar dataKey="losses" name="Losses" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="textSecondary">
                Win Rate
              </Typography>
              <Typography variant="h4">
                {((bankroll.winningBets / bankroll.totalBets) * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(bankroll.winningBets / bankroll.totalBets) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="textSecondary">
                ROI
              </Typography>
              <Typography
                variant="h4"
                color={bankroll.roi >= 0 ? 'success.main' : 'error.main'}
              >
                {bankroll.roi.toFixed(1)}%
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="body2" color="textSecondary">
                  Profit:
                </Typography>
                <Typography
                  variant="body2"
                  color={bankroll.totalProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(bankroll.totalProfit)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="textSecondary">
                Current Streak
              </Typography>
              <Typography variant="h4">
                {bankroll.currentStreak}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="body2" color="textSecondary">
                  Type:
                </Typography>
                <Chip
                  size="small"
                  label={bankroll.currentStreakType.toUpperCase()}
                  color={bankroll.currentStreakType === 'win' ? 'success' : 'error'}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </AnalyticsCard>
  );
}; 