import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { BettingOpportunity } from './BettingOpportunity';

interface Opportunity {
  id: string;
  event: {
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    sport: string;
  };
  market: string;
  selection: string;
  odds: number;
  probability: number;
  edge: number;
  confidence: number;
  volume: number;
  sentiment?: {
    score: number;
    volume: number;
  };
  stats?: {
    homeTeam: any;
    awayTeam: any;
  };
  arbitrage?: {
    roi: number;
    bookmakers: string[];
  };
}

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  onPlaceBet: (opportunity: Opportunity) => void;
}

type SortField = 'edge' | 'confidence' | 'odds' | 'volume' | 'probability';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'value' | 'arbitrage' | 'sentiment' | 'statistical';

export const OpportunitiesList: React.FC<OpportunitiesListProps> = ({
  opportunities,
  onPlaceBet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('edge');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [minEdge, setMinEdge] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);

  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = opportunities;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        opp =>
          opp.event.homeTeam.toLowerCase().includes(searchLower) ||
          opp.event.awayTeam.toLowerCase().includes(searchLower) ||
          opp.selection.toLowerCase().includes(searchLower) ||
          opp.market.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(opp => {
        switch (filterType) {
          case 'value':
            return opp.edge > 0;
          case 'arbitrage':
            return !!opp.arbitrage;
          case 'sentiment':
            return !!opp.sentiment;
          case 'statistical':
            return !!opp.stats;
          default:
            return true;
        }
      });
    }

    // Apply edge and confidence filters
    filtered = filtered.filter(
      opp => opp.edge >= minEdge && opp.confidence >= minConfidence
    );

    // Apply sorting
    return filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      const aValue = a[sortField];
      const bValue = b[sortField];
      return (aValue - bValue) * multiplier;
    });
  }, [
    opportunities,
    searchTerm,
    sortField,
    sortOrder,
    filterType,
    minEdge,
    minConfidence,
  ]);

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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Betting Opportunities
        </Typography>

        {/* Filters and Search */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
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
              <MenuItem value="all">All Opportunities</MenuItem>
              <MenuItem value="value">Value Bets</MenuItem>
              <MenuItem value="arbitrage">Arbitrage</MenuItem>
              <MenuItem value="sentiment">Sentiment Based</MenuItem>
              <MenuItem value="statistical">Statistical</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                type="number"
                label="Min Edge %"
                value={minEdge}
                onChange={(e) => setMinEdge(Number(e.target.value))}
                size="small"
              />
              <TextField
                fullWidth
                type="number"
                label="Min Confidence"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Sort Headers */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2">Event</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2">Market</Typography>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Tooltip title="Sort by Edge">
              <IconButton size="small" onClick={() => handleSort('edge')}>
                <SortIcon />
                {getSortIcon('edge')}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={1}>
            <Tooltip title="Sort by Confidence">
              <IconButton size="small" onClick={() => handleSort('confidence')}>
                <SortIcon />
                {getSortIcon('confidence')}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={1}>
            <Tooltip title="Sort by Odds">
              <IconButton size="small" onClick={() => handleSort('odds')}>
                <SortIcon />
                {getSortIcon('odds')}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={1}>
            <Tooltip title="Sort by Volume">
              <IconButton size="small" onClick={() => handleSort('volume')}>
                <SortIcon />
                {getSortIcon('volume')}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={1}>
            <Tooltip title="Sort by Probability">
              <IconButton size="small" onClick={() => handleSort('probability')}>
                <SortIcon />
                {getSortIcon('probability')}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2">Actions</Typography>
          </Grid>
        </Grid>

        {/* Opportunities List */}
        <Grid container spacing={2}>
          {filteredAndSortedOpportunities.map((opportunity) => (
            <Grid item xs={12} key={opportunity.id}>
              <BettingOpportunity
                opportunity={opportunity}
                onPlaceBet={onPlaceBet}
              />
            </Grid>
          ))}
          {filteredAndSortedOpportunities.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary" align="center">
                No opportunities match your criteria
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}; 