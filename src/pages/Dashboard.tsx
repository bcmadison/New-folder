import { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  SportsSoccer as SportsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useStore } from '@/store';
import { apiService } from '@/services/api';

export default function Dashboard() {
  const { user, events, bets, analytics, isLoading, error, setEvents, setBets, setAnalytics, setIsLoading, setError } = useStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [eventsData, betsData, analyticsData] = await Promise.all([
          apiService.getEvents({ status: 'upcoming' }),
          apiService.getBets({ status: 'pending' }),
          apiService.getAnalytics(),
        ]);
        setEvents(eventsData);
        setBets(betsData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [setEvents, setBets, setAnalytics, setIsLoading, setError]);

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

  const stats = [
    {
      title: 'Active Bets',
      value: bets.length,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
    },
    {
      title: 'Bankroll',
      value: `$${user?.bankroll.toFixed(2) || '0.00'}`,
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
    },
    {
      title: 'Upcoming Events',
      value: events.length,
      icon: <SportsIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
    },
    {
      title: 'Win Rate',
      value: `${analytics?.overall.winRate.toFixed(1) || '0'}%`,
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: '#f44336',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>{stat.icon}</Box>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Bets
              </Typography>
              {bets.length > 0 ? (
                bets.slice(0, 5).map((bet) => (
                  <Box key={bet.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {bet.market} - {bet.selection}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Odds: {bet.odds} | Stake: ${bet.stake}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No recent bets</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upcoming Events
              </Typography>
              {events.length > 0 ? (
                events.slice(0, 5).map((event) => (
                  <Box key={event.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {event.homeTeam} vs {event.awayTeam}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.sport} | {new Date(event.startTime).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No upcoming events</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 