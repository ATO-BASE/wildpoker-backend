import { Request, Response, NextFunction } from 'express';
import { User, Tournament, Hand, HandAction, Registration } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import { NotificationService } from '../services/notification.service';
import { NotificationSettings } from '../models/notification.settings.model';

export const updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      res.status(400).json({ error: 'Please upload a file' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // The path should be accessible from the client.
    // If the server serves static files from 'public',
    // the path should be relative to that public directory.
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    user.avatar = avatarPath;
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar,
    });
  } catch (err) {
    next(err);
  }
};

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId, { 
      attributes: { exclude: ['passwordHash'] }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function getUserDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    // Get user balance
    const user = await User.findByPk(userId, { attributes: ['id', 'username', 'balance'] });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get upcoming tournaments
    const now = new Date();
    const tournaments = await Tournament.findAll({
      where: { startsAt: { $gt: now } },
      order: [['startsAt', 'ASC']],
      limit: 10
    });

    // Get hand history: find all registrations for user, then hands via hand actions
    const registrations = await Registration.findAll({ where: { userId }, attributes: ['id'] });
    const registrationIds = registrations.map(r => r.id);
    const handActions = await HandAction.findAll({
      where: { registrationId: registrationIds.length ? registrationIds : 0 },
      attributes: ['handId'],
      group: ['handId'],
      order: [['handId', 'DESC']],
      limit: 20
    });
    const handIds = handActions.map(ha => ha.handId);
    const hands = handIds.length
      ? await Hand.findAll({ where: { id: handIds }, order: [['createdAt', 'DESC']] })
      : [];

    res.json({
      balance: user.balance,
      upcomingTournaments: tournaments,
      handHistory: hands
    });
  } catch (err) {
    next(err);
  }
}

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isMatch = await user.checkPassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect current password.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { firstName, country } = req.body;
  const userId = req.user!.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.firstName = firstName ?? user.firstName;
    user.country = country ?? user.country;

    await user.save();
    
    const { passwordHash, ...userResponse } = user.get();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const notifications = await NotificationService.getUserNotifications(userId, page, limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req:AuthRequest, res:Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = Number(req.params.id);
    await NotificationService.markAsRead(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let settings = await NotificationSettings.findOne({ where: { userId } });
    if (!settings) {
      settings = await NotificationSettings.create({
        userId,
        emailNotifications: true,
        onSiteNotifications: true,
        notifyBeforeTournament24h: true,
        notifyBeforeTournament1h: true,
        notifyBeforeTournament15m: true,
        notifyBeforeTournament5m: true
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    res.status(500).json({ message: 'Failed to get notification settings'});
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      emailNotifications,
      onSiteNotifications,
      notifyBeforeTournament24h,
      notifyBeforeTournament1h,
      notifyBeforeTournament15m,
      notifyBeforeTournament5m
    } = req.body;
    let settings = await NotificationSettings.findOne({ where: { userId } });
    if (!settings) {
      settings = await NotificationSettings.create({
        userId,
        emailNotifications,
        onSiteNotifications,
        notifyBeforeTournament24h,
        notifyBeforeTournament1h,
        notifyBeforeTournament15m,
        notifyBeforeTournament5m
      });
    } else {
      await settings.update({
        emailNotifications,
        onSiteNotifications,
        notifyBeforeTournament24h,
        notifyBeforeTournament1h,
        notifyBeforeTournament15m,
        notifyBeforeTournament5m
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
}; 