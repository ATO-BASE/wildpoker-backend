import { Notification, Tournament, User } from '../models';
import { Op } from 'sequelize';
import { NOTIFICATION_CONFIG, getDeduplicationWindow } from '../config/notification.config';

export class NotificationDeduplicationService {
  // Cache to track sent notifications to prevent duplicates
  private static sentNotificationsCache = new Map<string, Date>();
  private static readonly CACHE_CLEANUP_INTERVAL = NOTIFICATION_CONFIG.CACHE_CLEANUP.INTERVAL_HOURS * 60 * 60 * 1000;

  /**
   * Generate a unique key for notification deduplication
   */
  private static generateNotificationKey(
    userId: number, 
    type: string, 
    tournamentId?: number, 
    reminderType?: string
  ): string {
    if (tournamentId && reminderType) {
      return `${userId}_${type}_${tournamentId}_${reminderType}`;
    }
    return `${userId}_${type}`;
  }

  /**
   * Check if a notification was already sent within the specified time window
   */
  static async hasNotificationBeenSent(
    userId: number,
    type: string,
    tournamentId?: number,
    reminderType?: string,
    timeWindowMinutes: number = 60
  ): Promise<boolean> {
    const key = this.generateNotificationKey(userId, type, tournamentId, reminderType);
    const now = new Date();
    const timeWindow = timeWindowMinutes * 60 * 1000; // Convert to milliseconds

    // Check cache first
    const cachedTime = this.sentNotificationsCache.get(key);
    if (cachedTime && (now.getTime() - cachedTime.getTime()) < timeWindow) {
      return true;
    }

    // Check database for recent notifications
    const recentNotification = await Notification.findOne({
      where: {
        userId,
        type: type as any,
        isSent: true,
        sendAt: {
          [Op.gte]: new Date(now.getTime() - timeWindow)
        },
        ...(tournamentId && reminderType ? {
          data: {
            [Op.like]: `%"tournamentId":${tournamentId},"reminderType":"${reminderType}"%`
          }
        } : {})
      }
    });

    return !!recentNotification;
  }

  /**
   * Mark a notification as sent to prevent duplicates
   */
  static async markNotificationAsSent(
    userId: number,
    type: string,
    tournamentId?: number,
    reminderType?: string
  ): Promise<void> {
    const key = this.generateNotificationKey(userId, type, tournamentId, reminderType);
    this.sentNotificationsCache.set(key, new Date());

    // Clean up old cache entries periodically
    this.cleanupCache();
  }

  /**
   * Clean up old cache entries to prevent memory leaks
   */
  private static cleanupCache(): void {
    const now = new Date();
    const entriesToDelete: string[] = [];

    for (const [key, timestamp] of this.sentNotificationsCache.entries()) {
      if (now.getTime() - timestamp.getTime() > this.CACHE_CLEANUP_INTERVAL) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.sentNotificationsCache.delete(key));
  }

  /**
   * Create a tournament notification with deduplication
   */
  static async createTournamentNotificationWithDeduplication(
    tournament: Tournament,
    userId: number,
    reminderType: string,
    timeWindowMinutes?: number
  ): Promise<boolean> {
    const window = timeWindowMinutes || getDeduplicationWindow('tournament_reminder');
    // Check if notification was already sent
    const alreadySent = await this.hasNotificationBeenSent(
      userId,
      'tournament_reminder',
      tournament.id,
      reminderType,
      window
    );

    if (alreadySent) {
      console.log(`Notification already sent for user ${userId}, tournament ${tournament.id}, type ${reminderType}`);
      return false;
    }

    // Create the notification
    const notification = await Notification.create({
      userId,
      type: 'tournament_reminder' as const,
      title: `Tournament Reminder: ${tournament.name}`,
      body: `Your tournament "${tournament.name}" starts in ${reminderType}. Get ready!`,
      sendAt: new Date(),
      isSent: false,
      data: JSON.stringify({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        reminderType: reminderType
      })
    });

    // Mark as sent to prevent duplicates
    await this.markNotificationAsSent(userId, 'tournament_reminder', tournament.id, reminderType);

    return true;
  }

  /**
   * Create a system notification with deduplication
   */
  static async createSystemNotificationWithDeduplication(
    userId: number,
    title: string,
    body: string,
    timeWindowMinutes?: number
  ): Promise<boolean> {
    const window = timeWindowMinutes || getDeduplicationWindow('system');
    // Check if notification was already sent
    const alreadySent = await this.hasNotificationBeenSent(
      userId,
      'system',
      undefined,
      undefined,
      window
    );

    if (alreadySent) {
      console.log(`System notification already sent for user ${userId}`);
      return false;
    }

    // Create the notification
    await Notification.create({
      userId,
      type: 'system' as const,
      title,
      body,
      sendAt: new Date(),
      isSent: false
    });

    // Mark as sent to prevent duplicates
    await this.markNotificationAsSent(userId, 'system');

    return true;
  }

  /**
   * Get notification statistics for debugging
   */
  static getNotificationStats(): { cacheSize: number; cacheEntries: string[] } {
    return {
      cacheSize: this.sentNotificationsCache.size,
      cacheEntries: Array.from(this.sentNotificationsCache.keys())
    };
  }
}
