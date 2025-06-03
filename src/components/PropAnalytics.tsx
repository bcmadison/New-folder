import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  Timeline as TimelineIcon,
  SportsScore as ScoreIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { PropPrediction } from '@/services/sportsAnalytics';

interface PropAnalyticsProps {
  prediction: PropPrediction;
  onBetSelect: (amount: number, type: 'over' | 'under', modifier?: 'goblin' | 'devil') => void;
}

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

const ConfidenceBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  marginTop: theme.spacing(1),
}));

const FactorChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export const PropAnalytics: React.FC<PropAnalyticsProps> = ({ prediction, onBetSelect }) => {
  const [expanded, setExpanded] = React.useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success.main';
    if (confidence >= 60) return 'primary.main';
    if (confidence >= 40) return 'warning.main';
    return 'error.main';
  };

  const getExpectedValueColor = (ev: number) => {
    if (ev >= 1.1) return 'success.main';
    if (ev >= 1.05) return 'primary.main';
    if (ev >= 1) return 'warning.main';
    return 'error.main';
  };

  return (
    <AnalyticsCard>
      <CardContent>
        <Grid container spacing={2}>
          {/* Header */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {prediction.propType.toUpperCase()} Analysis
              </Typography>
              <IconButton onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Grid>

          {/* Confidence Score */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1">Confidence Score</Typography>
              <Typography
                variant="h6"
                color={getConfidenceColor(prediction.confidence)}
              >
                {prediction.confidence}%
              </Typography>
            </Box>
            <ConfidenceBar
              variant="determinate"
              value={prediction.confidence}
              sx={{
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getConfidenceColor(prediction.confidence),
                },
              }}
            />
          </Grid>

          {/* Historical Accuracy */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1}>
              <TrophyIcon color="primary" />
              <Typography variant="body1">
                Historical Accuracy: {(prediction.historicalAccuracy * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>

          {/* Recommended Bet */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Recommended Bet
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Type
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {prediction.recommendedBet.type.toUpperCase()}
                    {prediction.recommendedBet.modifier && (
                      <Chip
                        size="small"
                        label={prediction.recommendedBet.modifier}
                        color={prediction.recommendedBet.modifier === 'goblin' ? 'success' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Expected Value
                  </Typography>
                  <Typography
                    variant="h6"
                    color={getExpectedValueColor(prediction.recommendedBet.expectedValue)}
                  >
                    {prediction.recommendedBet.expectedValue.toFixed(2)}x
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Detailed Analysis */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Key Factors
              </Typography>
              <List>
                {prediction.factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TimelineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={factor.name}
                      secondary={factor.description}
                    />
                    <Chip
                      label={`${(factor.impact * 100).toFixed(0)}% Impact`}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Collapse>
        </Grid>
      </CardContent>
    </AnalyticsCard>
  );
}; 