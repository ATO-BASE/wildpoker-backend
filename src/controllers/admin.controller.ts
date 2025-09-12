import { Request, Response, NextFunction } from 'express';
import { User, Tournament, Transaction, sequelize } from '../models';
import { sendVerificationEmail } from '../services/mail.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NotificationSettings } from '../models/notification.settings.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';
import { config } from '../config/environment';

const signToken = (id: number, role: string) => {
    const secret = config.JWT_SECRET;
    const expiresIn = config.JWT_EXPIRES;
    if (!secret) throw new Error('JWT_SECRET not set');
    const options: jwt.SignOptions = {};
    if (typeof expiresIn === 'string' || typeof expiresIn === 'number') {
        options.expiresIn = expiresIn as any;
    }
    return jwt.sign({ id, role }, secret, options);
};

// Admin registration function
export const adminRegister = async (req: Request, res: Response) => {
   const { username, email, country, password, firstName } = req.body;
   
       const existing = await User.findOne({ where: { email } });
       if (existing) {
           res.status(409).json({ message: 'Email already used' });
           return;
       }
   
       const passwordHash = await bcrypt.hash(password, 12);
       // Generate emailToken and emailTokenExpires only if they exist in the model
       // @ts-ignore
       // const emailToken = crypto.randomBytes(32).toString('hex');
       // @ts-ignore
       // const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
   
   
       let user = await User.create({
           username,
           email,
           country,
           firstName,
           passwordHash,
           isEmailVerified: false,
           verifiedCode: '',
           role: 'admin',
           balance: '0.00',
           points: 0,
       });
       const code = await sendVerificationEmail(email);
       res.status(201).json({ message: 'Registration successful. Check your inbox.' });
       user.verifiedCode = code;
       user.save();
};

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalUsers = await User.count();
    const totalTournaments = await Tournament.count();
    
    const totalRevenueResult = await Transaction.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue']
      ],
      where: {
        type: 'deposit', // Or however you define revenue-generating transactions
        status: 'completed'
      },
      raw: true
    });

    const totalRevenue = (totalRevenueResult as any)?.totalRevenue || 0;
    res.json({
      totalUsers,
      totalTournaments,
      totalRevenue
    });
  } catch (err) {
    next(err);
  }
}

// List all users (no pagination for admin panel)
export async function listAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
    return;
  } catch (err) {
    next(err);
  }
}

// Get user profile by ID
export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(user);
    return;
  } catch (err) {
    next(err);
  }
}

// Update user details by ID
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { role, status, isEmailVerified } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

    await user.save();
    res.json(user);
    return;
  } catch (err) {
    next(err);
  }
}

// Delete user by ID
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    await user.destroy();
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
}

export const getCurrentAdmin = async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findByPk(req.admin.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get Current Admin Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    res.status(500).json({ message: 'Internal server error' });
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
    console.error('Failed to update notification settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminSendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body, userId } = req.body;
    if (!title || !body) {
      res.status(400).json({ message: 'Title and body are required.' });
      return;
    }
    if (userId) {
      // Send to a specific user
      await NotificationService.createAdminNotification(title, body, userId);
    } else {
      // Send to all users
      await NotificationService.createAdminNotificationForAll(title, body);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    res.status(500).json({ message: 'Failed to send notification.' });
  }
}; 