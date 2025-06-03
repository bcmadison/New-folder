import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { notificationService } from '@/services/notification';
import { riskManagement } from '@/services/riskManagement';

const SettingsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sound: boolean;
    types: {
      odds: boolean;
      injuries: boolean;
      lineMovements: boolean;
      breakingNews: boolean;
      social: boolean;
      system: boolean;
    };
  };
  betting: {
    maxBetSize: number;
    minBetSize: number;
    autoConfirm: boolean;
    defaultBetType: 'straight' | 'parlay' | 'teaser';
    kellyFraction: number;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    timezone: string;
    dateFormat: string;
  };
}

const DEFAULT_SETTINGS: Settings = {
  notifications: {
    email: true,
    push: true,
    inApp: true,
    sound: true,
    types: {
      odds: true,
      injuries: true,
      lineMovements: true,
      breakingNews: true,
      social: true,
      system: true,
    },
  },
  betting: {
    maxBetSize: 100,
    minBetSize: 10,
    autoConfirm: false,
    defaultBetType: 'straight',
    kellyFraction: 0.5,
  },
  display: {
    theme: 'system',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
  },
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleNotificationChange = (key: keyof Settings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleNotificationTypeChange = (type: keyof Settings['notifications']['types'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        types: {
          ...prev.notifications.types,
          [type]: value,
        },
      },
    }));
  };

  const handleBettingChange = (key: keyof Settings['betting'], value: any) => {
    setSettings(prev => ({
      ...prev,
      betting: {
        ...prev.betting,
        [key]: value,
      },
    }));
  };

  const handleDisplayChange = (key: keyof Settings['display'], value: string) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    // TODO: Implement settings persistence
    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success',
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSnackbar({
      open: true,
      message: 'Settings reset to defaults',
      severity: 'success',
    });
  };

  return (
    <SettingsCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Settings
        </Typography>

        <Grid container spacing={3}>
          {/* Notification Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Notifications
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={(e) => handleNotificationChange('push', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.inApp}
                      onChange={(e) => handleNotificationChange('inApp', e.target.checked)}
                    />
                  }
                  label="In-App Notifications"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sound}
                      onChange={(e) => handleNotificationChange('sound', e.target.checked)}
                    />
                  }
                  label="Sound Notifications"
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Notification Types
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(settings.notifications.types).map(([type, enabled]) => (
                <Grid item xs={12} sm={6} md={4} key={type}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(e) => handleNotificationTypeChange(type as keyof Settings['notifications']['types'], e.target.checked)}
                      />
                    }
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Betting Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Betting Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Bet Size"
                  type="number"
                  value={settings.betting.maxBetSize}
                  onChange={(e) => handleBettingChange('maxBetSize', Number(e.target.value))}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Bet Size"
                  type="number"
                  value={settings.betting.minBetSize}
                  onChange={(e) => handleBettingChange('minBetSize', Number(e.target.value))}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Bet Type</InputLabel>
                  <Select
                    value={settings.betting.defaultBetType}
                    label="Default Bet Type"
                    onChange={(e) => handleBettingChange('defaultBetType', e.target.value)}
                  >
                    <MenuItem value="straight">Straight Bet</MenuItem>
                    <MenuItem value="parlay">Parlay</MenuItem>
                    <MenuItem value="teaser">Teaser</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.betting.autoConfirm}
                      onChange={(e) => handleBettingChange('autoConfirm', e.target.checked)}
                    />
                  }
                  label="Auto-Confirm Bets"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Kelly Criterion Fraction: {settings.betting.kellyFraction}
                </Typography>
                <Slider
                  value={settings.betting.kellyFraction}
                  onChange={(_, value) => handleBettingChange('kellyFraction', value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Display Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Display Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.display.theme}
                    label="Theme"
                    onChange={(e) => handleDisplayChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={settings.display.currency}
                    label="Currency"
                    onChange={(e) => handleDisplayChange('currency', e.target.value)}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.display.timezone}
                    label="Timezone"
                    onChange={(e) => handleDisplayChange('timezone', e.target.value)}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={settings.display.dateFormat}
                    label="Date Format"
                    onChange={(e) => handleDisplayChange('dateFormat', e.target.value)}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleReset}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
              >
                Save Settings
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </SettingsCard>
  );
}; 