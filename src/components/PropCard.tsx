import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  IconButton,
  Collapse,
  Button,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface Prop {
  id: string;
  name: string;
  value: number;
  overMultiplier: number;
  underMultiplier: number;
  modifier?: 'goblin' | 'devil';
  modifierMultiplier?: number;
  confidence?: number;
  fireCount?: number;
  winRate?: number;
}

interface PropCardProps {
  player: {
    name: string;
    team: string;
    imageUrl?: string;
    position: string;
  };
  props: Prop[];
  onSelect: (propId: string, selection: 'over' | 'under', modifier?: 'goblin' | 'devil') => void;
}

const ExpandableCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(1),
  },
}));

const PropOption = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ModifierChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  '&.goblin': {
    background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
    color: 'white',
  },
  '&.devil': {
    background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
    color: 'white',
  },
}));

const ConfidenceIndicator = styled(LinearProgress)(({ theme }) => ({
  height: 4,
  borderRadius: 2,
  marginTop: theme.spacing(0.5),
}));

export const PropCard: React.FC<PropCardProps> = ({ player, props, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedProps, setSelectedProps] = useState<Record<string, { selection: 'over' | 'under', modifier?: 'goblin' | 'devil' }>>({});

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handlePropSelect = (propId: string, selection: 'over' | 'under', modifier?: 'goblin' | 'devil') => {
    setSelectedProps(prev => ({
      ...prev,
      [propId]: { selection, modifier },
    }));
    onSelect(propId, selection, modifier);
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 3) return 'success.main';
    if (multiplier >= 2) return 'primary.main';
    return 'warning.main';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success.main';
    if (confidence >= 60) return 'primary.main';
    if (confidence >= 40) return 'warning.main';
    return 'error.main';
  };

  return (
    <ExpandableCard>
      <CardContent>
        {/* Player Header */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={2}>
            {player.imageUrl && (
              <Box
                component="img"
                src={player.imageUrl}
                alt={player.name}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
          </Grid>
          <Grid item xs={8}>
            <Typography variant="h6">{player.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {player.team} • {player.position}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <IconButton onClick={handleExpand}>
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Grid>
        </Grid>

        {/* Props List */}
        <Collapse in={expanded}>
          <Box mt={2}>
            {props.map((prop) => (
              <Box key={prop.id} mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">
                    {prop.name}
                  </Typography>
                  {prop.fireCount && prop.fireCount > 0 && (
                    <Tooltip title={`${prop.fireCount} people are hot on this prop`}>
                      <Box display="flex" alignItems="center">
                        <FireIcon color="error" />
                        <Typography variant="body2" color="error" ml={0.5}>
                          {prop.fireCount}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>
                <Grid container spacing={1}>
                  {/* Over Option */}
                  <Grid item xs={6}>
                    <PropOption
                      onClick={() => handlePropSelect(prop.id, 'over')}
                      sx={{
                        bgcolor: selectedProps[prop.id]?.selection === 'over' ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <TrendingUpIcon color="success" />
                          <Typography variant="body1" ml={1}>
                            Over {prop.value}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          color={getMultiplierColor(prop.overMultiplier)}
                        >
                          {prop.overMultiplier}x
                        </Typography>
                      </Box>
                    </PropOption>
                  </Grid>

                  {/* Under Option */}
                  <Grid item xs={6}>
                    <PropOption
                      onClick={() => handlePropSelect(prop.id, 'under')}
                      sx={{
                        bgcolor: selectedProps[prop.id]?.selection === 'under' ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <TrendingDownIcon color="error" />
                          <Typography variant="body1" ml={1}>
                            Under {prop.value}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          color={getMultiplierColor(prop.underMultiplier)}
                        >
                          {prop.underMultiplier}x
                        </Typography>
                      </Box>
                    </PropOption>
                  </Grid>

                  {/* Confidence and Win Rate */}
                  {(prop.confidence || prop.winRate) && (
                    <Grid item xs={12}>
                      <Box mt={1}>
                        {prop.confidence && (
                          <Box mb={1}>
                            <Typography variant="caption" color="textSecondary">
                              Confidence: {prop.confidence}%
                            </Typography>
                            <ConfidenceIndicator
                              variant="determinate"
                              value={prop.confidence}
                              sx={{ bgcolor: 'grey.200' }}
                            />
                          </Box>
                        )}
                        {prop.winRate && (
                          <Box display="flex" alignItems="center">
                            <TrophyIcon color="primary" sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption" color="textSecondary">
                              Win Rate: {prop.winRate}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* Modifiers */}
                  {prop.modifier && (
                    <Grid item xs={12}>
                      <Box mt={1} display="flex" gap={1}>
                        <Button
                          size="small"
                          variant={selectedProps[prop.id]?.modifier === 'goblin' ? 'contained' : 'outlined'}
                          color="success"
                          onClick={() => handlePropSelect(prop.id, selectedProps[prop.id]?.selection || 'over', 'goblin')}
                          startIcon={<AddIcon />}
                        >
                          Goblin ({prop.modifierMultiplier}x)
                        </Button>
                        <Button
                          size="small"
                          variant={selectedProps[prop.id]?.modifier === 'devil' ? 'contained' : 'outlined'}
                          color="error"
                          onClick={() => handlePropSelect(prop.id, selectedProps[prop.id]?.selection || 'over', 'devil')}
                          startIcon={<RemoveIcon />}
                        >
                          Devil ({prop.modifierMultiplier}x)
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </ExpandableCard>
  );
}; 