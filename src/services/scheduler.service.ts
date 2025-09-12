import { TournamentNotificationService } from './tournament-notification.service';

export class SchedulerService {
  private static notificationInterval: NodeJS.Timeout;

  static startNotificationScheduler() {
    // Check for timed notifications every minute
    this.notificationInterval = setInterval(async () => {
      try {
        await TournamentNotificationService.checkAndSendTimedNotifications();
      } catch (error) {
        console.error('Error processing timed notifications:', error);
      }
    }, 60000); // 1 minute
  }

  static stopNotificationScheduler() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }
} 