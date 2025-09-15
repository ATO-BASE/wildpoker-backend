import { Op } from 'sequelize';
import { Notification, Tournament, User, Registration } from '../models';
import { transporter } from '../lib/mailer';
import { io, userSocketMap } from '../index';

export class TournamentNotificationService {
  
  /**
   * Notification Types:
   * 0 - Tournament created notification (once to users who registered)
   * 1 - 24 hours before start (once to users who registered)
   * 2 - 1 hour before start (once to users who registered)
   * 3 - 15 minutes before start (once to users who registered)
   * 4 - 5 minutes before start (once to users who registered)
   * 5 - Tournament start notification (once to users who registered)
   * 6 - Tournament finished notification (once to users who registered)
   */

  /**
   * Send tournament created notification to all registered users
   */
  static async sendTournamentCreatedNotification(tournament: Tournament, registeredUserIds: number[]) {
    console.log(`📢 Sending tournament created notification for: ${tournament.name}`);
    
    for (const userId of registeredUserIds) {
      // Check if notification already sent
      const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 0);
      if (alreadySent) {
        console.log(`⏭️ Tournament created notification already sent to user ${userId}`);
        continue;
      }

      // Send real-time notification
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        io.to(socketId).emit('tournament:created', {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          type: 'tournament_created'
        });
      }

      // Create database notification
      await Notification.create({
        userId,
        type: 'tournament_created' as const,
        title: `New Tournament: ${tournament.name}`,
        body: `A new tournament "${tournament.name}" is now open for registration!`,
        sendAt: new Date(),
        isSent: true,
        data: JSON.stringify({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          notificationType: 0
        })
      });

      console.log(`✅ Tournament created notification sent to user ${userId}`);
    }
  }

  /**
   * Check and send notifications based on exact timing
   */
  static async checkAndSendTimedNotifications() {
    const now = new Date();
    console.log(`🕐 Checking timed notifications at: ${now.toISOString()}`);

    // Get all active tournaments
    const tournaments = await Tournament.findAll({
      where: {
        status: {
          [Op.in]: ['registering', 'running']
        }
      }
    });

    for (const tournament of tournaments) {
      const startTime = new Date(tournament.startsAt);
      const endTime = new Date(startTime.getTime() + (tournament.duration * 60 * 60 * 1000));
      
      // Get registered users for this tournament
      const registeredUsers = await this.getRegisteredUsers(tournament.id);
      if (registeredUsers.length === 0) continue;

      // Check each notification type
      await this.checkNotificationType1(tournament, registeredUsers, now, startTime); // 24h before
      await this.checkNotificationType2(tournament, registeredUsers, now, startTime); // 1h before
      await this.checkNotificationType3(tournament, registeredUsers, now, startTime); // 15min before
      await this.checkNotificationType4(tournament, registeredUsers, now, startTime); // 5min before
      await this.checkNotificationType5(tournament, registeredUsers, now, startTime); // start
      await this.checkNotificationType6(tournament, registeredUsers, now, endTime); // finished
    }
  }

  /**
   * Notification Type 1: 24 hours before start
   */
  private static async checkNotificationType1(tournament: Tournament, registeredUsers: number[], now: Date, startTime: Date) {
    const targetTime = new Date(startTime.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    
    // Check if we're within 1 minute of the target time
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending 24h notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 1);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 1, '24 hours', 'Your tournament starts in 24 hours!');
        console.log(`✅ 24h notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Notification Type 2: 1 hour before start
   */
  private static async checkNotificationType2(tournament: Tournament, registeredUsers: number[], now: Date, startTime: Date) {
    const targetTime = new Date(startTime.getTime() - (60 * 60 * 1000)); // 1 hour before
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending 1h notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 2);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 2, '1 hour', 'Your tournament starts in 1 hour!');
        console.log(`✅ 1h notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Notification Type 3: 15 minutes before start
   */
  private static async checkNotificationType3(tournament: Tournament, registeredUsers: number[], now: Date, startTime: Date) {
    const targetTime = new Date(startTime.getTime() - (15 * 60 * 1000)); // 15 minutes before
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending 15min notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 3);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 3, '15 minutes', 'Your tournament starts in 15 minutes!');
        console.log(`✅ 15min notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Notification Type 4: 5 minutes before start
   */
  private static async checkNotificationType4(tournament: Tournament, registeredUsers: number[], now: Date, startTime: Date) {
    const targetTime = new Date(startTime.getTime() - (5 * 60 * 1000)); // 5 minutes before
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending 5min notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 4);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 4, '5 minutes', 'Your tournament starts in 5 minutes!');
        console.log(`✅ 5min notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Notification Type 5: Tournament start
   */
  private static async checkNotificationType5(tournament: Tournament, registeredUsers: number[], now: Date, startTime: Date) {
    const timeDiff = Math.abs(now.getTime() - startTime.getTime());
    
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending start notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 5);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 5, 'now', 'Your tournament has started! Click Enter Lobby to join.');
        console.log(`✅ Start notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Notification Type 6: Tournament finished
   */
  private static async checkNotificationType6(tournament: Tournament, registeredUsers: number[], now: Date, endTime: Date) {
    const timeDiff = Math.abs(now.getTime() - endTime.getTime());
    
    if (timeDiff <= 60000) { // 1 minute tolerance
      console.log(`📢 Sending finished notification for tournament: ${tournament.name}`);
      
      for (const userId of registeredUsers) {
        const alreadySent = await this.hasNotificationBeenSent(userId, tournament.id, 6);
        if (alreadySent) continue;

        await this.sendNotification(userId, tournament, 6, 'finished', 'Your tournament has finished! Check the results.');
        console.log(`✅ Finished notification sent to user ${userId}`);
      }
    }
  }

  /**
   * Send notification to user
   */
  private static async sendNotification(
    userId: number, 
    tournament: Tournament, 
    notificationType: number, 
    timeLabel: string, 
    message: string
  ) {
    // Send real-time notification
    const socketId = userSocketMap.get(userId);
    if (socketId) {
      io.to(socketId).emit('tournament:notification', {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        type: notificationType,
        timeLabel,
        message
      });
    }

    // Create database notification
    await Notification.create({
      userId,
      type: 'tournament_reminder' as const,
      title: `Tournament ${timeLabel}: ${tournament.name}`,
      body: message,
      sendAt: new Date(),
      isSent: true,
      data: JSON.stringify({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        notificationType,
        timeLabel
      })
    });

    // Send email notification
    const user = await User.findByPk(userId);
    if (user?.email) {
      await transporter.sendMail({
        from: 'support@wildpoker.co',
        to: user.email,
        subject: `Tournament ${timeLabel}: ${tournament.name}`,
        text: message,
        html: `
          <h2>Tournament ${timeLabel}: ${tournament.name}</h2>
          <p>${message}</p>
          <p>Log in to your account to view details.</p>
        `
      });
    }
  }

  /**
   * Check if notification has already been sent
   */
  private static async hasNotificationBeenSent(userId: number, tournamentId: number, notificationType: number): Promise<boolean> {
    const existingNotification = await Notification.findOne({
      where: {
        userId,
        type: notificationType === 0 ? 'tournament_created' : 'tournament_reminder',
        data: {
          [Op.like]: `%"tournamentId":${tournamentId},"notificationType":${notificationType}%`
        },
        isSent: true
      }
    });

    return !!existingNotification;
  }

  /**
   * Get registered users for a tournament
   */
  private static async getRegisteredUsers(tournamentId: number): Promise<number[]> {
    const registrations = await Registration.findAll({
      where: {
        tournamentId: tournamentId,
        status: {
          [Op.in]: ['registered', 'playing'] // Include both registered and playing users
        }
      },
      attributes: ['userId'],
      group: ['userId']
    });

    return registrations.map(r => r.userId);
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    const stats = await Notification.findAll({
      attributes: [
        'type',
        [Notification.sequelize!.fn('COUNT', '*'), 'count']
      ],
      group: ['type']
    });

    return stats;
  }
}
