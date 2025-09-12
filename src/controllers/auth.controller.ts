import { User } from '../models';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/mail.service';
import { NotificationSettings } from '../models/notification.settings.model';
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

export const register = async (req: Request, res: Response) => {
    try {
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
            role: 'player',
            balance: '0.00',
            points: 0,
        });

        // Create default notification settings
        await NotificationSettings.create({
            userId: user.id,
            emailNotifications: true,
            onSiteNotifications: true,
            notifyBeforeTournament24h: true,
            notifyBeforeTournament1h: true,
            notifyBeforeTournament15m: true,
            notifyBeforeTournament5m: true
        });

        const code = await sendVerificationEmail(email);
        res.status(201).json({ message: 'Registration successful. Check your inbox.'});
        user.verifiedCode = code;
        user.save();
    } catch (err) {
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email invalid' });
        return;
    }
    // @ts-ignore
    const user = await User.findOne({ where: { email: email } });

    // @ts-ignore
    if (!user) {
        res.status(400).json({ message: 'No user exists' });
        return;
    }
    if (user.verifiedCode !== code) {
        res.status(400).json({ message: 'Email no verified' });
        return;
    }

    user.isEmailVerified = true;

    await user.save();

    res.json({ message: 'Email verified, you can now log in.' });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) { res.status(400).json({ message: 'Invalid credentials' }); return; }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
    }

    if (!user.isEmailVerified) {
        res.status(401).json({ message: 'Verify your email first' });
        return;
    }

    const token = signToken(user.id, user.role);
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            country: user.country,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            balance: user.balance,
            points: user.points,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    });
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        
        // @ts-ignore
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(400).json({ message: 'No user exists' });
            return;
        }
        
        if (user.isEmailVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }
        
        const code = await sendVerificationEmail(email);
        user.verifiedCode = code;
        await user.save();
        
        res.json({ message: 'Verification code resent' });
    } catch (error) {
        console.error('Error in resendVerification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
