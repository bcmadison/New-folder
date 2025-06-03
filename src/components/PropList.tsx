import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { PropCard } from './PropCard';

interface Player {
  name: string;
  team: string;
  imageUrl?: string;
  position: string;
}

interface Prop {
  id: string;
  name: string;
  value: number;
  overMultiplier: number;
  underMultiplier: number;
  modifier?: 'goblin' | 'devil';
  modifierMultiplier?: number;
}

interface PropListProps {
  players: Array<{
    player: Player;
    props: Prop[];
  }>;
  onPropSelect: (playerName: string, propId: string, selection: 'over' | 'under', modifier?: 'goblin' | 'devil') => void;
  isLoading?: boolean;
}

type SortField = 'multiplier' | 'value' | 'name';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'goblin' | 'devil' | 'normal';

export const PropList: React.FC<PropListProps> = ({
  players,
  onPropSelect,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('multiplier');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [minMultiplier, setMinMultiplier] = useState(1);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ({ player }) =>
          player.name.toLowerCase().includes(searchLower) ||
          player.team.toLowerCase().includes(searchLower) ||
          player.position.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.map(({ player, props }) => ({
        player,
        props: props.filter(prop => {
          if (filterType === 'normal') return !prop.modifier;
          return prop.modifier === filterType;
        }),
      })).filter(({ props }) => props.length > 0);
    }

    // Apply multiplier filter
    filtered = filtered.map(({ player, props }) => ({
      player,
      props: props.filter(
        prop =>
          prop.overMultiplier >= minMultiplier ||
          prop.underMultiplier >= minMultiplier
      ),
    })).filter(({ props }) => props.length > 0);

    // Sort players based on their highest multiplier
    return filtered.sort((a, b) => {
      const aMaxMultiplier = Math.max(
        ...a.props.map(p => Math.max(p.overMultiplier, p.underMultiplier))
      );
      const bMaxMultiplier = Math.max(
        ...b.props.map(p => Math.max(p.overMultiplier, p.underMultiplier))
      );
      return sortOrder === 'desc'
        ? bMaxMultiplier - aMaxMultiplier
        : aMaxMultiplier - bMaxMultiplier;
    });
  }, [players, searchTerm, sortField, sortOrder, filterType, minMultiplier]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Typography variant="h4" gutterBottom>
          Available Props
        </Typography>

        {/* Filters and Search */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Players"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              size="small"
            >
              <MenuItem value="all">All Props</MenuItem>
              <MenuItem value="normal">Normal Props</MenuItem>
              <MenuItem value="goblin">Goblin Props</MenuItem>
              <MenuItem value="devil">Devil Props</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Min Multiplier"
              value={minMultiplier}
              onChange={(e) => setMinMultiplier(Number(e.target.value))}
              size="small"
              inputProps={{ min: 1, step: 0.1 }}
            />
          </Grid>
        </Grid>

        {/* Props Grid */}
        <Grid container spacing={3}>
          {filteredAndSortedPlayers.map(({ player, props }) => (
            <Grid item xs={12} md={6} lg={4} key={player.name}>
              <PropCard
                player={player}
                props={props}
                onSelect={(propId, selection, modifier) =>
                  onPropSelect(player.name, propId, selection, modifier)
                }
              />
            </Grid>
          ))}
          {filteredAndSortedPlayers.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary" align="center">
                No props match your criteria
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}; 