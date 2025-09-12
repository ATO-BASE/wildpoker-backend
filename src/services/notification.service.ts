import { Op } from 'sequelize';
import { Notification, Tournament, User } from '../models';
import { transporter } from '../lib/mailer';
import { io, userSocketMap } from '../index';
import { NotificationDeduplicationService } from './notification-deduplication.service';

export class NotificationService {
  private static readonly NOTIFICATION_INTERVALS = [
    { hours: 24, label: '1 day', type: '1day' },
    { hours: 1, label: '1 hour', type: '1hour' },
    { minutes: 15, label: '15 minutes', type: '15min' },
    { minutes: 0, label: 'now', type: 'start' }
  ];

  // Send notification to all users when a tournament is created
  static async notifyTournamentCreated(tournament: Tournament) {
    const users = await User.findAll({ attributes: ['id'] });
    
    // Send real-time notification to all connected users
    io.emit('tournament:created', {
      tournamentId: tournament.id,
      tournamentName: tournament.name
    });

    // Create database notifications for all users
    for (const user of users) {
      await Notification.create({
        userId: user.id,
        type: 'tournament_created' as const,
        title: `New Tournament: ${tournament.name}`,
        body: `A new tournament "${tournament.name}" is now open for registration!`,
        sendAt: new Date(),
        isSent: true
      });
    }
  }

  static async createTournamentNotifications(tournament: Tournament, registeredUserIds: number[]) {
    const startTime = new Date(tournament.startsAt);

    for (const userId of registeredUserIds) {
      for (const interval of this.NOTIFICATION_INTERVALS) {
        const sendAt = new Date(startTime);
        if (interval.hours) {
          sendAt.setHours(sendAt.getHours() - interval.hours);
        }
        if (interval.minutes) {
          sendAt.setMinutes(sendAt.getMinutes() - interval.minutes);
        }

        // Use deduplication service to prevent duplicate notifications
        const notificationCreated = await NotificationDeduplicationService.createTournamentNotificationWithDeduplication(
          tournament,
          userId,
          interval.type,
          60 // 60 minutes time window
        );

        if (notificationCreated) {
          // Update the sendAt time for the created notification
          await Notification.update(
            { sendAt },
            {
              where: {
                userId,
                type: 'tournament_reminder',
                data: {
                  [Op.like]: `%"tournamentId":${tournament.id},"reminderType":"${interval.type}"%`
                },
                isSent: false
              }
            }
          );
        }
      }
    }
  }

  static async processNotifications() {
    const now = new Date();
    const pendingNotifications = await Notification.findAll({
      where: {
        isSent: false,
        sendAt: {
          [Op.lte]: now
        }
      },
      include: [{ model: User, as: 'user' }]
    });

    for (let notification of pendingNotifications as (Notification & { user: User })[]) {
      try {
        const user = notification.user;
        
        // Additional deduplication check before processing
        if (notification.type === 'tournament_reminder' && notification.data) {
          const data = JSON.parse(notification.data as string);
          const alreadySent = await NotificationDeduplicationService.hasNotificationBeenSent(
            notification.userId,
            'tournament_reminder',
            data.tournamentId,
            data.reminderType,
            5 // 5 minutes grace period
          );
          
          if (alreadySent) {
            console.log(`Skipping duplicate notification for user ${notification.userId}, tournament ${data.tournamentId}`);
            await notification.update({ isSent: true });
            continue;
          }
        }
        
        // Handle tournament reminder notifications
        if (notification.type === 'tournament_reminder' && notification.data) {
          const data = JSON.parse(notification.data as string);
          
          // Send real-time tournament reminder
          const socketId = userSocketMap.get(notification.userId);
          if (socketId) {
            io.to(socketId).emit('tournament:reminder', {
              tournamentId: data.tournamentId,
              tournamentName: data.tournamentName,
              timeRemaining: notification.body,
              type: data.reminderType
            });
          }
        }
        
        // Send email notification
        if (user?.email && (notification.type === 'tournament_reminder' || notification.type === 'system')) {
          await transporter.sendMail({
            to: user.email,
            subject: notification.title,
            text: notification.body,
            html: `
              <h2>${notification.title}</h2>
              <p>${notification.body}</p>
              <p>Log in to your account to view details.</p>
            `
          });
        }
        
        // Emit general notification if user is connected
        const socketId = userSocketMap.get(notification.userId);
        if (socketId) {
          io.to(socketId).emit('notification', notification.toJSON());
        }
        
        // Mark as sent
        await notification.update({ isSent: true });
        
        // Update deduplication cache
        if (notification.type === 'tournament_reminder' && notification.data) {
          const data = JSON.parse(notification.data as string);
          await NotificationDeduplicationService.markNotificationAsSent(
            notification.userId,
            'tournament_reminder',
            data.tournamentId,
            data.reminderType
          );
        }
        
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
      }
    }
  }

  static async getUserNotifications(userId: number, page = 1, limit = 10) {
    return await Notification.findAndCountAll({
      where: { userId },
      order: [['sendAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
  }

  static async markAsRead(notificationId: number, userId: number) {
    await Notification.update(
      { readAt: new Date() },
      { where: { id: notificationId, userId } }
    );
  }

  static async createAdminNotification(title: string, body: string, userId: number) {
    const notificationCreated = await NotificationDeduplicationService.createSystemNotificationWithDeduplication(
      userId,
      title,
      body,
      60 // 60 minutes time window
    );

    if (!notificationCreated) {
      console.log(`Admin notification already sent for user ${userId}`);
    }
  }

  static async createAdminNotificationForAll(title: string, body: string) {
    const users = await User.findAll({ attributes: ['id'] });
    for (const user of users) {
      await this.createAdminNotification(title, body, user.id);
    }
  }
} 