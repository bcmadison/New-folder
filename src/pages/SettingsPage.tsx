import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useStore } from '@/store';

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sound: false,
  });
  const [displaySettings, setDisplaySettings] = useState({
    darkMode: true,
    compactView: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleSaveSettings = async () => {
    try {
      // Mock API call to save settings
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email: e.target.checked })
                    }
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.push}
                    onChange={(e) =>
                      setNotifications({ ...notifications, push: e.target.checked })
                    }
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.sound}
                    onChange={(e) =>
                      setNotifications({ ...notifications, sound: e.target.checked })
                    }
                  />
                }
                label="Sound Alerts"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Display Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={displaySettings.darkMode}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        darkMode: e.target.checked,
                      })
                    }
                  />
                }
                label="Dark Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={displaySettings.compactView}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        compactView: e.target.checked,
                      })
                    }
                  />
                }
                label="Compact View"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Account Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={user?.username || ''}
                    disabled
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveSettings}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 