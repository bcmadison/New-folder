import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useStore } from '@/store';

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
      id={`bets-tabpanel-${index}`}
      aria-labelledby={`bets-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BetsPage() {
  const { bets, setBets } = useStore();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddBet = () => {
    setSelectedBet(null);
    setOpenDialog(true);
  };

  const handleEditBet = (bet: any) => {
    setSelectedBet(bet);
    setOpenDialog(true);
  };

  const handleDeleteBet = async (betId: string) => {
    try {
      // Mock API call
      setBets(bets.filter((bet) => bet.id !== betId));
    } catch (err) {
      setError('Failed to delete bet');
    }
  };

  const handleSaveBet = async () => {
    try {
      if (selectedBet) {
        // Mock API call to update bet
        setBets(
          bets.map((bet) =>
            bet.id === selectedBet.id ? { ...bet, ...selectedBet } : bet
          )
        );
      } else {
        // Mock API call to create new bet
        const newBet = {
          id: Date.now().toString(),
          event: 'New Event',
          market: 'Moneyline',
          selection: 'Home',
          odds: 2.0,
          stake: 100,
          status: 'pending',
          timestamp: new Date().toISOString(),
        };
        setBets([newBet, ...bets]);
      }
      setOpenDialog(false);
      setError('');
    } catch (err) {
      setError('Failed to save bet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Bets Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBet}
        >
          Add Bet
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Active Bets" />
            <Tab label="History" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Market</TableCell>
                    <TableCell>Selection</TableCell>
                    <TableCell>Odds</TableCell>
                    <TableCell>Stake</TableCell>
                    <TableCell>Potential Return</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bets
                    .filter((bet) => bet.status === 'pending')
                    .map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>{bet.event}</TableCell>
                        <TableCell>{bet.market}</TableCell>
                        <TableCell>{bet.selection}</TableCell>
                        <TableCell>{bet.odds}</TableCell>
                        <TableCell>${bet.stake}</TableCell>
                        <TableCell>
                          ${(bet.odds * bet.stake).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bet.status}
                            color={getStatusColor(bet.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditBet(bet)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBet(bet.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Market</TableCell>
                    <TableCell>Selection</TableCell>
                    <TableCell>Odds</TableCell>
                    <TableCell>Stake</TableCell>
                    <TableCell>Return</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bets
                    .filter((bet) => bet.status !== 'pending')
                    .map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>{bet.event}</TableCell>
                        <TableCell>{bet.market}</TableCell>
                        <TableCell>{bet.selection}</TableCell>
                        <TableCell>{bet.odds}</TableCell>
                        <TableCell>${bet.stake}</TableCell>
                        <TableCell>
                          ${(bet.odds * bet.stake).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bet.status}
                            color={getStatusColor(bet.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(bet.timestamp).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedBet ? 'Edit Bet' : 'Add New Bet'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event"
            fullWidth
            value={selectedBet?.event || ''}
            onChange={(e) =>
              setSelectedBet({ ...selectedBet, event: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Market"
            fullWidth
            value={selectedBet?.market || ''}
            onChange={(e) =>
              setSelectedBet({ ...selectedBet, market: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Selection"
            fullWidth
            value={selectedBet?.selection || ''}
            onChange={(e) =>
              setSelectedBet({ ...selectedBet, selection: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Odds"
            type="number"
            fullWidth
            value={selectedBet?.odds || ''}
            onChange={(e) =>
              setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) })
            }
          />
          <TextField
            margin="dense"
            label="Stake"
            type="number"
            fullWidth
            value={selectedBet?.stake || ''}
            onChange={(e) =>
              setSelectedBet({ ...selectedBet, stake: parseFloat(e.target.value) })
            }
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveBet} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 