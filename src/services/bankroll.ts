import { notificationService } from './notification';

export interface BankrollTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss';
  amount: number;
  timestamp: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
}

export interface BankrollStats {
  currentBalance: number;
  startingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  netProfit: number;
  roi: number;
  winRate: number;
  averageBetSize: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
}

export interface BankrollSettings {
  maxBetPercentage: number;
  minBetPercentage: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxDailyBets: number;
  maxConcurrentBets: number;
  riskLevel: 'low' | 'medium' | 'high';
  autoRebalance: boolean;
  rebalanceThreshold: number;
}

class BankrollService {
  private balance: number = 0;
  private transactions: BankrollTransaction[] = [];
  private settings: BankrollSettings = {
    maxBetPercentage: 0.05, // 5% of bankroll
    minBetPercentage: 0.01, // 1% of bankroll
    stopLossPercentage: 0.20, // 20% of bankroll
    takeProfitPercentage: 0.50, // 50% of bankroll
    maxDailyBets: 10,
    maxConcurrentBets: 3,
    riskLevel: 'medium',
    autoRebalance: true,
    rebalanceThreshold: 0.10, // 10% deviation
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const storedBalance = localStorage.getItem('bankroll_balance');
    const storedTransactions = localStorage.getItem('bankroll_transactions');
    const storedSettings = localStorage.getItem('bankroll_settings');

    if (storedBalance) this.balance = parseFloat(storedBalance);
    if (storedTransactions) this.transactions = JSON.parse(storedTransactions);
    if (storedSettings) this.settings = JSON.parse(storedSettings);
  }

  private saveToStorage() {
    localStorage.setItem('bankroll_balance', this.balance.toString());
    localStorage.setItem('bankroll_transactions', JSON.stringify(this.transactions));
    localStorage.setItem('bankroll_settings', JSON.stringify(this.settings));
  }

  deposit(amount: number, description: string = 'Deposit'): BankrollTransaction {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    
    const transaction: BankrollTransaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      timestamp: new Date().toISOString(),
      description,
      status: 'completed',
    };

    this.balance += amount;
    this.transactions.push(transaction);
    this.saveToStorage();
    
    notificationService.notify(
      'success',
      'Deposit Successful',
      `Successfully deposited $${amount.toFixed(2)}`,
      transaction
    );

    return transaction;
  }

  withdraw(amount: number, description: string = 'Withdrawal'): BankrollTransaction {
    if (amount <= 0) throw new Error('Withdrawal amount must be positive');
    if (amount > this.balance) throw new Error('Insufficient funds');

    const transaction: BankrollTransaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description,
      status: 'completed',
    };

    this.balance -= amount;
    this.transactions.push(transaction);
    this.saveToStorage();

    notificationService.notify(
      'info',
      'Withdrawal Successful',
      `Successfully withdrew $${amount.toFixed(2)}`,
      transaction
    );

    return transaction;
  }

  placeBet(amount: number, betDetails: any): BankrollTransaction {
    if (amount <= 0) throw new Error('Bet amount must be positive');
    if (amount > this.balance) throw new Error('Insufficient funds');
    if (amount > this.getMaxBetAmount()) throw new Error('Bet amount exceeds maximum allowed');
    if (this.getDailyBetsCount() >= this.settings.maxDailyBets) throw new Error('Maximum daily bets reached');
    if (this.getConcurrentBetsCount() >= this.settings.maxConcurrentBets) throw new Error('Maximum concurrent bets reached');

    const transaction: BankrollTransaction = {
      id: Date.now().toString(),
      type: 'bet',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description: `Bet on ${betDetails.selection}`,
      status: 'completed',
      metadata: betDetails,
    };

    this.balance -= amount;
    this.transactions.push(transaction);
    this.saveToStorage();

    notificationService.notify(
      'info',
      'Bet Placed',
      `Placed bet of $${amount.toFixed(2)} on ${betDetails.selection}`,
      transaction
    );

    return transaction;
  }

  recordWin(amount: number, betDetails: any): BankrollTransaction {
    const transaction: BankrollTransaction = {
      id: Date.now().toString(),
      type: 'win',
      amount,
      timestamp: new Date().toISOString(),
      description: `Win on ${betDetails.selection}`,
      status: 'completed',
      metadata: betDetails,
    };

    this.balance += amount;
    this.transactions.push(transaction);
    this.saveToStorage();

    notificationService.notify(
      'success',
      'Bet Won',
      `Won $${amount.toFixed(2)} on ${betDetails.selection}`,
      transaction
    );

    return transaction;
  }

  recordLoss(amount: number, betDetails: any): BankrollTransaction {
    const transaction: BankrollTransaction = {
      id: Date.now().toString(),
      type: 'loss',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description: `Loss on ${betDetails.selection}`,
      status: 'completed',
      metadata: betDetails,
    };

    this.transactions.push(transaction);
    this.saveToStorage();

    notificationService.notify(
      'error',
      'Bet Lost',
      `Lost $${amount.toFixed(2)} on ${betDetails.selection}`,
      transaction
    );

    return transaction;
  }

  getBalance(): number {
    return this.balance;
  }

  getTransactions(): BankrollTransaction[] {
    return this.transactions;
  }

  getSettings(): BankrollSettings {
    return this.settings;
  }

  updateSettings(newSettings: Partial<BankrollSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
  }

  getStats(): BankrollStats {
    const stats: BankrollStats = {
      currentBalance: this.balance,
      startingBalance: this.getStartingBalance(),
      totalDeposits: this.getTotalDeposits(),
      totalWithdrawals: this.getTotalWithdrawals(),
      totalBets: this.getTotalBets(),
      totalWins: this.getTotalWins(),
      totalLosses: this.getTotalLosses(),
      netProfit: this.getNetProfit(),
      roi: this.getROI(),
      winRate: this.getWinRate(),
      averageBetSize: this.getAverageBetSize(),
      largestWin: this.getLargestWin(),
      largestLoss: this.getLargestLoss(),
      currentStreak: this.getCurrentStreak(),
      bestStreak: this.getBestStreak(),
      worstStreak: this.getWorstStreak(),
    };

    return stats;
  }

  private getStartingBalance(): number {
    const firstDeposit = this.transactions.find(t => t.type === 'deposit');
    return firstDeposit ? firstDeposit.amount : 0;
  }

  private getTotalDeposits(): number {
    return this.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getTotalWithdrawals(): number {
    return Math.abs(this.transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0));
  }

  private getTotalBets(): number {
    return this.transactions.filter(t => t.type === 'bet').length;
  }

  private getTotalWins(): number {
    return this.transactions.filter(t => t.type === 'win').length;
  }

  private getTotalLosses(): number {
    return this.transactions.filter(t => t.type === 'loss').length;
  }

  private getNetProfit(): number {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private getROI(): number {
    const totalBets = this.getTotalBets();
    if (totalBets === 0) return 0;
    return (this.getNetProfit() / this.getTotalDeposits()) * 100;
  }

  private getWinRate(): number {
    const totalBets = this.getTotalBets();
    if (totalBets === 0) return 0;
    return (this.getTotalWins() / totalBets) * 100;
  }

  private getAverageBetSize(): number {
    const bets = this.transactions.filter(t => t.type === 'bet');
    if (bets.length === 0) return 0;
    return Math.abs(bets.reduce((sum, t) => sum + t.amount, 0)) / bets.length;
  }

  private getLargestWin(): number {
    const wins = this.transactions.filter(t => t.type === 'win');
    if (wins.length === 0) return 0;
    return Math.max(...wins.map(t => t.amount));
  }

  private getLargestLoss(): number {
    const losses = this.transactions.filter(t => t.type === 'loss');
    if (losses.length === 0) return 0;
    return Math.abs(Math.min(...losses.map(t => t.amount)));
  }

  private getCurrentStreak(): number {
    let streak = 0;
    for (let i = this.transactions.length - 1; i >= 0; i--) {
      const t = this.transactions[i];
      if (t.type === 'win') streak++;
      else if (t.type === 'loss') break;
    }
    return streak;
  }

  private getBestStreak(): number {
    let currentStreak = 0;
    let bestStreak = 0;
    for (const t of this.transactions) {
      if (t.type === 'win') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (t.type === 'loss') {
        currentStreak = 0;
      }
    }
    return bestStreak;
  }

  private getWorstStreak(): number {
    let currentStreak = 0;
    let worstStreak = 0;
    for (const t of this.transactions) {
      if (t.type === 'loss') {
        currentStreak++;
        worstStreak = Math.max(worstStreak, currentStreak);
      } else if (t.type === 'win') {
        currentStreak = 0;
      }
    }
    return worstStreak;
  }

  getMaxBetAmount(): number {
    return this.balance * this.settings.maxBetPercentage;
  }

  private getDailyBetsCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.transactions.filter(t => 
      t.type === 'bet' && 
      t.timestamp.startsWith(today)
    ).length;
  }

  private getConcurrentBetsCount(): number {
    return this.transactions.filter(t => 
      t.type === 'bet' && 
      t.status === 'completed'
    ).length;
  }

  checkStopLoss(): boolean {
    const stopLossAmount = this.getStartingBalance() * this.settings.stopLossPercentage;
    if (this.getNetProfit() <= -stopLossAmount) {
      notificationService.notify(
        'warning',
        'Stop Loss Reached',
        `Your bankroll has reached the stop loss limit of $${stopLossAmount.toFixed(2)}`,
        { stopLossAmount, currentBalance: this.balance }
      );
      return true;
    }
    return false;
  }

  checkTakeProfit(): boolean {
    const takeProfitAmount = this.getStartingBalance() * this.settings.takeProfitPercentage;
    if (this.getNetProfit() >= takeProfitAmount) {
      notificationService.notify(
        'success',
        'Take Profit Reached',
        `Your bankroll has reached the take profit target of $${takeProfitAmount.toFixed(2)}`,
        { takeProfitAmount, currentBalance: this.balance }
      );
      return true;
    }
    return false;
  }
}

export const bankrollService = new BankrollService(); 