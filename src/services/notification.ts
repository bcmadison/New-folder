import { toast } from 'react-toastify';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

interface NotificationPreferences {
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
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private subscribers: Set<(notification: Notification) => void> = new Set();
  private preferences: NotificationPreferences = {
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
  };

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  notify(
    type: Notification['type'],
    title: string,
    message: string,
    action?: Notification['action']
  ): void {
    const notification: Notification = {
      id: `notification_${Date.now()}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      action,
    };

    this.notifications.unshift(notification);
    this.notifySubscribers(notification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Handle different notification types
    switch (type) {
      case 'error':
        this.handleErrorNotification(notification);
        break;
      case 'warning':
        this.handleWarningNotification(notification);
        break;
      case 'success':
        this.handleSuccessNotification(notification);
        break;
      case 'info':
        this.handleInfoNotification(notification);
        break;
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers(notification);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifySubscribers(this.notifications[0]);
  }

  clearNotifications(): void {
    this.notifications = [];
    this.notifySubscribers({
      id: 'clear',
      type: 'info',
      title: 'Notifications Cleared',
      message: 'All notifications have been cleared',
      timestamp: Date.now(),
      read: true,
    });
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences,
      types: {
        ...this.preferences.types,
        ...(preferences.types || {}),
      },
    };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(notification: Notification): void {
    this.subscribers.forEach(callback => callback(notification));
  }

  private handleErrorNotification(notification: Notification): void {
    if (this.preferences.inApp) {
      // Show in-app error notification
      console.error(`[ERROR] ${notification.title}: ${notification.message}`);
    }
    if (this.preferences.push) {
      // Send push notification
      this.sendPushNotification(notification);
    }
    if (this.preferences.email) {
      // Send email notification
      this.sendEmailNotification(notification);
    }
  }

  private handleWarningNotification(notification: Notification): void {
    if (this.preferences.inApp) {
      // Show in-app warning notification
      console.warn(`[WARNING] ${notification.title}: ${notification.message}`);
    }
    if (this.preferences.push) {
      // Send push notification
      this.sendPushNotification(notification);
    }
  }

  private handleSuccessNotification(notification: Notification): void {
    if (this.preferences.inApp) {
      // Show in-app success notification
      console.log(`[SUCCESS] ${notification.title}: ${notification.message}`);
    }
    if (this.preferences.sound) {
      // Play success sound
      this.playNotificationSound('success');
    }
  }

  private handleInfoNotification(notification: Notification): void {
    if (this.preferences.inApp) {
      // Show in-app info notification
      console.log(`[INFO] ${notification.title}: ${notification.message}`);
    }
  }

  private sendPushNotification(notification: Notification): void {
    // TODO: Implement push notification service
    // This would integrate with a service like Firebase Cloud Messaging
  }

  private sendEmailNotification(notification: Notification): void {
    // TODO: Implement email notification service
    // This would integrate with an email service provider
  }

  private playNotificationSound(type: 'success' | 'error' | 'warning' | 'info'): void {
    // TODO: Implement sound notification
    // This would play different sounds based on notification type
  }

  // Strategy-specific notifications
  notifyStrategyExecution(strategyName: string, bets: any[]) {
    this.notify(
      'info',
      'Strategy Executed',
      `Strategy "${strategyName}" executed and placed ${bets.length} bets`,
      { strategyName, bets }
    );
  }

  notifyHighValueOpportunity(opportunity: any) {
    this.notify(
      'success',
      'High Value Opportunity',
      `Found high-value bet: ${opportunity.description} with ${opportunity.edge}% edge`,
      opportunity
    );
  }

  notifyArbitrageOpportunity(opportunity: any) {
    this.notify(
      'success',
      'Arbitrage Opportunity',
      `Found arbitrage opportunity with ${opportunity.roi}% ROI`,
      opportunity
    );
  }

  notifyBetResult(bet: any) {
    const type = bet.status === 'won' ? 'success' : 'error';
    this.notify(
      type,
      `Bet ${bet.status}`,
      `Your bet on ${bet.selection} has ${bet.status}`,
      bet
    );
  }

  notifyBankrollAlert(alert: { type: string; message: string; data: any }) {
    this.notify(
      'warning',
      'Bankroll Alert',
      alert.message,
      alert.data
    );
  }

  notifyOddsMovement(movement: any) {
    this.notify(
      'info',
      'Odds Movement',
      `Odds for ${movement.selection} have moved from ${movement.oldOdds} to ${movement.newOdds}`,
      movement
    );
  }

  notifySentimentChange(sentiment: any) {
    this.notify(
      'info',
      'Sentiment Change',
      `Sentiment for ${sentiment.topic} has changed to ${sentiment.score}`,
      sentiment
    );
  }
}

export const notificationService = NotificationService.getInstance(); 