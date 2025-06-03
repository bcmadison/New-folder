import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/store';
import { apiService } from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { analytics, isLoading, error, setAnalytics, setIsLoading, setError } = useStore();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [setAnalytics, setIsLoading, setError]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const monthlyData = analytics?.monthlyPerformance.map((month) => ({
    name: month.month,
    profitLoss: month.profitLoss,
    roi: month.roi,
  })) || [];

  const sportData = Object.entries(analytics?.bySport || {}).map(([sport, data]) => ({
    name: sport,
    winRate: data.winRate,
    profitLoss: data.profitLoss,
  }));

  const marketData = Object.entries(analytics?.byMarket || {}).map(([market, data]) => ({
    name: market,
    winRate: data.winRate,
    profitLoss: data.profitLoss,
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Bets
              </Typography>
              <Typography variant="h4">
                {analytics?.overall.totalBets || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4">
                {analytics?.overall.winRate.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Profit/Loss
              </Typography>
              <Typography variant="h4" color={analytics?.overall.profitLoss >= 0 ? 'success.main' : 'error.main'}>
                ${analytics?.overall.profitLoss.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ROI
              </Typography>
              <Typography variant="h4" color={analytics?.overall.roi >= 0 ? 'success.main' : 'error.main'}>
                {analytics?.overall.roi.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Monthly Performance" />
          <Tab label="By Sport" />
          <Tab label="By Market" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="profitLoss"
                  stroke="#2196f3"
                  name="Profit/Loss"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="roi"
                  stroke="#4caf50"
                  name="ROI"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="winRate"
                  fill="#2196f3"
                  name="Win Rate"
                />
                <Bar
                  yAxisId="right"
                  dataKey="profitLoss"
                  fill="#4caf50"
                  name="Profit/Loss"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="winRate"
                  fill="#2196f3"
                  name="Win Rate"
                />
                <Bar
                  yAxisId="right"
                  dataKey="profitLoss"
                  fill="#4caf50"
                  name="Profit/Loss"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
} 