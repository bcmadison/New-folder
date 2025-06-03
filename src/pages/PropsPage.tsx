import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SportsBasketball as BasketballIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
} from '@mui/icons-material';
import { PropList } from '@/components/PropList';
import { PropAnalytics } from '@/components/PropAnalytics';
import { TrendingProps } from '@/components/TrendingProps';
import { notificationService } from '@/services/notification';
import { sportsAnalytics, Sport, PropPrediction } from '@/services/sportsAnalytics';

// Sample data for demonstration
const samplePlayers = [
  {
    player: {
      name: 'LeBron James',
      team: 'LAL',
      position: 'F',
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
    },
    props: [
      {
        id: 'points_1',
        name: 'Points',
        value: 25.5,
        overMultiplier: 1.8,
        underMultiplier: 1.9,
        confidence: 85,
        fireCount: 156,
        winRate: 72,
      },
      {
        id: 'rebounds_1',
        name: 'Rebounds',
        value: 7.5,
        overMultiplier: 1.85,
        underMultiplier: 1.85,
        modifier: 'goblin' as const,
        modifierMultiplier: 2.5,
        confidence: 65,
        fireCount: 89,
        winRate: 68,
      },
      {
        id: 'assists_1',
        name: 'Assists',
        value: 8.5,
        overMultiplier: 1.9,
        underMultiplier: 1.8,
        modifier: 'devil' as const,
        modifierMultiplier: 3.0,
        confidence: 45,
        fireCount: 42,
        winRate: 55,
      },
    ],
  },
  {
    player: {
      name: 'Stephen Curry',
      team: 'GSW',
      position: 'G',
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png',
    },
    props: [
      {
        id: 'points_2',
        name: 'Points',
        value: 28.5,
        overMultiplier: 1.85,
        underMultiplier: 1.85,
        confidence: 90,
        fireCount: 234,
        winRate: 78,
      },
      {
        id: 'threes_2',
        name: '3-Pointers Made',
        value: 4.5,
        overMultiplier: 1.9,
        underMultiplier: 1.8,
        modifier: 'goblin' as const,
        modifierMultiplier: 2.5,
        confidence: 75,
        fireCount: 167,
        winRate: 82,
      },
      {
        id: 'assists_2',
        name: 'Assists',
        value: 6.5,
        overMultiplier: 1.85,
        underMultiplier: 1.85,
        confidence: 60,
        fireCount: 78,
        winRate: 65,
      },
    ],
  },
  {
    player: {
      name: 'Nikola Jokic',
      team: 'DEN',
      position: 'C',
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png',
    },
    props: [
      {
        id: 'points_3',
        name: 'Points',
        value: 26.5,
        overMultiplier: 1.85,
        underMultiplier: 1.85,
        confidence: 80,
        fireCount: 145,
        winRate: 75,
      },
      {
        id: 'rebounds_3',
        name: 'Rebounds',
        value: 12.5,
        overMultiplier: 1.9,
        underMultiplier: 1.8,
        modifier: 'devil' as const,
        modifierMultiplier: 3.0,
        confidence: 70,
        fireCount: 112,
        winRate: 80,
      },
      {
        id: 'assists_3',
        name: 'Assists',
        value: 9.5,
        overMultiplier: 1.85,
        underMultiplier: 1.85,
        confidence: 55,
        fireCount: 67,
        winRate: 62,
      },
    ],
  },
];

// Sample trending props
const sampleTrendingProps = [
  {
    id: 'trend_1',
    playerName: 'Stephen Curry',
    team: 'GSW',
    propType: '3-Pointers Made',
    value: 4.5,
    direction: 'over' as const,
    modifier: 'goblin' as const,
    confidence: 90,
    fireCount: 234,
    communityStats: {
      likes: 156,
      comments: 42,
      shares: 23,
    },
    topComment: {
      user: 'PropMaster',
      avatar: 'https://i.pravatar.cc/150?img=1',
      text: 'Curry has hit this in 8 of his last 10 games. Easy money!',
      likes: 45,
    },
  },
  // Add more trending props...
];

export const PropsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport>('NBA');
  const [selectedProp, setSelectedProp] = useState<string | null>(null);
  const [propPrediction, setPropPrediction] = useState<PropPrediction | null>(null);
  const [minConfidence, setMinConfidence] = useState(60);
  const [minFireCount, setMinFireCount] = useState(50);

  useEffect(() => {
    if (selectedProp) {
      loadPropPrediction(selectedProp);
    }
  }, [selectedProp, selectedSport]);

  const loadPropPrediction = async (propId: string) => {
    setIsLoading(true);
    try {
      const prediction = await sportsAnalytics.analyzeProp(selectedSport, propId);
      setPropPrediction(prediction);
    } catch (error) {
      notificationService.notify('error', 'Error loading prediction', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropSelect = (playerName: string, propId: string, selection: 'over' | 'under', modifier?: 'goblin' | 'devil') => {
    setSelectedProp(propId);
    notificationService.notify(
      'success',
      'Prop Selected',
      `${playerName} - ${selection.toUpperCase()} ${propId}${modifier ? ` (${modifier})` : ''}`
    );
  };

  const handleTrendingPropSelect = (propId: string) => {
    setSelectedProp(propId);
  };

  const handleBetSelect = (amount: number, type: 'over' | 'under', modifier?: 'goblin' | 'devil') => {
    notificationService.notify(
      'success',
      'Bet Placed',
      `$${amount} on ${type.toUpperCase()}${modifier ? ` (${modifier})` : ''}`
    );
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">
                PrizePicks Props
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  label="Sport"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value as Sport)}
                  size="small"
                >
                  <MenuItem value="NBA">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BasketballIcon />
                      NBA
                    </Box>
                  </MenuItem>
                  <MenuItem value="WNBA">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BasketballIcon />
                      WNBA
                    </Box>
                  </MenuItem>
                  <MenuItem value="MLB">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BaseballIcon />
                      MLB
                    </Box>
                  </MenuItem>
                  <MenuItem value="SOCCER">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SoccerIcon />
                      Soccer
                    </Box>
                  </MenuItem>
                </TextField>
                <TextField
                  type="number"
                  label="Min Confidence"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 0, max: 100 }}
                />
                <TextField
                  type="number"
                  label="Min Fire Count"
                  value={minFireCount}
                  onChange={(e) => setMinFireCount(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <PropList
              players={samplePlayers}
              onPropSelect={handlePropSelect}
              isLoading={isLoading}
            />
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box position="sticky" top={24}>
              {selectedProp && propPrediction && (
                <Box mb={3}>
                  <PropAnalytics
                    prediction={propPrediction}
                    onBetSelect={handleBetSelect}
                  />
                </Box>
              )}
              <TrendingProps
                props={sampleTrendingProps}
                onPropSelect={handleTrendingPropSelect}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 