import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
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
  LocalHospital as InjuryIcon,
  Notifications as NewsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { realTimeUpdates } from '@/services/realTimeUpdates';
import { Sport } from '@/services/sportsAnalytics';

const UpdatesCard = styled(Card)(({ theme }) => ({
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
      id={`updates-tabpanel-${index}`}
      aria-labelledby={`updates-tab-${index}`}
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

export const RealTimeUpdates: React.FC<{ sport: Sport }> = ({ sport }) => {
  const [value, setValue] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [updates, setUpdates] = useState<{
    odds: any[];
    injuries: any[];
    lineMovements: any[];
    news: any[];
  }>({
    odds: [],
    injuries: [],
    lineMovements: [],
    news: [],
  });

  useEffect(() => {
    const loadUpdates = async () => {
      const sportUpdates = await realTimeUpdates.getSportUpdates(sport);
      setUpdates(sportUpdates);
    };

    loadUpdates();
    const unsubscribe = realTimeUpdates.subscribe('odds', (data) => {
      setUpdates(prev => ({
        ...prev,
        odds: [data, ...prev.odds].slice(0, 10),
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [sport]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <UpdatesCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Real-Time Updates
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Tabs
            value={value}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Odds" />
            <Tab label="Injuries" />
            <Tab label="Line Movements" />
            <Tab label="News" />
          </Tabs>

          <TabPanel value={value} index={0}>
            <List>
              {updates.odds.map((odds, index) => (
                <React.Fragment key={odds.propId}>
                  <ListItem>
                    <ListItemIcon>
                      {odds.movement.direction === 'up' ? (
                        <TrendingUpIcon color="success" />
                      ) : odds.movement.direction === 'down' ? (
                        <TrendingDownIcon color="error" />
                      ) : (
                        <InfoIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${odds.value} (${odds.movement.direction})`}
                      secondary={`Updated ${formatTimestamp(odds.timestamp)}`}
                    />
                    <Box display="flex" gap={1}>
                      <Chip
                        size="small"
                        label={`O ${odds.overMultiplier}x`}
                        color="success"
                      />
                      <Chip
                        size="small"
                        label={`U ${odds.underMultiplier}x`}
                        color="error"
                      />
                    </Box>
                  </ListItem>
                  {index < updates.odds.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <List>
              {updates.injuries.map((injury, index) => (
                <React.Fragment key={injury.playerId}>
                  <ListItem>
                    <ListItemIcon>
                      <InjuryIcon
                        color={
                          injury.status === 'out' ? 'error' :
                          injury.status === 'questionable' ? 'warning' :
                          'success'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${injury.playerName} (${injury.team})`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {injury.status.toUpperCase()}
                          </Typography>
                          {` - ${injury.injury}`}
                          {injury.expectedReturn && (
                            <Typography component="span" variant="body2" color="textSecondary">
                              {` - Expected return: ${injury.expectedReturn}`}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < updates.injuries.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <List>
              {updates.lineMovements.map((movement, index) => (
                <React.Fragment key={`${movement.propId}_${movement.timestamp}`}>
                  <ListItem>
                    <ListItemIcon>
                      {movement.direction === 'up' ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${movement.oldValue} → ${movement.newValue}`}
                      secondary={`Updated ${formatTimestamp(movement.timestamp)}`}
                    />
                    <Chip
                      size="small"
                      label={`${movement.confidence}% confidence`}
                      color={movement.confidence >= 80 ? 'success' : 'warning'}
                    />
                  </ListItem>
                  {index < updates.lineMovements.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={value} index={3}>
            <List>
              {updates.news.map((news, index) => (
                <React.Fragment key={news.id}>
                  <ListItem>
                    <ListItemIcon>
                      <NewsIcon
                        color={
                          news.impact === 'high' ? 'error' :
                          news.impact === 'medium' ? 'warning' :
                          'info'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={news.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {news.type.toUpperCase()}
                          </Typography>
                          {` - ${news.content}`}
                          <Typography component="span" variant="body2" color="textSecondary">
                            {` - ${formatTimestamp(news.timestamp)}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < updates.news.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>
        </Collapse>
      </CardContent>
    </UpdatesCard>
  );
}; 