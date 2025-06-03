import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useStore } from '@/store';
import { apiService } from '@/services/api';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  amount: number;
  description: string;
  timestamp: string;
}

export default function BankrollPage() {
  const { user, setUser } = useStore();
  const [amount, setAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 1000,
      description: 'Initial deposit',
      timestamp: '2024-02-20T10:00:00Z',
    },
    {
      id: '2',
      type: 'bet',
      amount: -50,
      description: 'Lakers vs Warriors - Moneyline',
      timestamp: '2024-02-20T11:30:00Z',
    },
    {
      id: '3',
      type: 'win',
      amount: 95,
      description: 'Lakers vs Warriors - Moneyline',
      timestamp: '2024-02-20T14:00:00Z',
    },
  ]);

  const handleTransaction = async () => {
    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      // Mock API call
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: transactionType,
        amount: transactionType === 'deposit' ? amountValue : -amountValue,
        description: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`,
        timestamp: new Date().toISOString(),
      };

      setTransactions([newTransaction, ...transactions]);
      setUser({
        ...user!,
        bankroll: user!.bankroll + newTransaction.amount,
      });
      setAmount('');
      setOpenDialog(false);
      setError('');
    } catch (err) {
      setError('Failed to process transaction');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Bankroll Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h3" sx={{ mb: 2 }}>
                ${user?.bankroll.toFixed(2) || '0.00'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setTransactionType('deposit');
                  setOpenDialog(true);
                }}
                sx={{ mr: 1 }}
              >
                Deposit
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setTransactionType('withdrawal');
                  setOpenDialog(true);
                }}
              >
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Transaction History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={
                              transaction.type === 'deposit' || transaction.type === 'win'
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {transaction.type.charAt(0).toUpperCase() +
                              transaction.type.slice(1)}
                          </Typography>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color:
                              transaction.amount >= 0
                                ? 'success.main'
                                : 'error.main',
                          }}
                        >
                          {transaction.amount >= 0 ? '+' : ''}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {transactionType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleTransaction} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 