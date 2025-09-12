import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUserDashboard, updateAvatar, changePassword, updateProfile, getUserNotifications, markNotificationAsRead, getNotificationSettings, updateNotificationSettings, getProfile } from '../controllers/user.controller';
import { upload } from '../middleware/upload.middleware';
import { registerForTournament, unregisterFromTournament, getAllTournamentsPublic, getTournamentById, getTournamentRegistrations, enterLobby } from '../controllers/tournament.controller';
import { depositFunds, withdrawFunds, getWalletHistory } from '../controllers/wallet.controller';

export const userRouter = Router();
userRouter.get('/dashboard', authenticate, getUserDashboard);
userRouter.get('/profile', authenticate, getProfile);
userRouter.put('/avatar', authenticate, upload.single('avatar'), updateAvatar);
userRouter.put('/change-password', authenticate, changePassword);
userRouter.put('/profile', authenticate, updateProfile);
// userRouter.put('/profile', protect, updateProfile);

// Tournament routes
userRouter.get('/tournaments', authenticate, getAllTournamentsPublic);
userRouter.get('/tournaments/:id', authenticate, getTournamentById);
userRouter.post('/tournaments/:tournamentId/register', authenticate, registerForTournament);
userRouter.delete('/tournaments/:tournamentId/register', authenticate, unregisterFromTournament);
userRouter.post('/tournaments/:tournamentId/enter-lobby', authenticate, enterLobby);
userRouter.get('/tournaments/:id/players', authenticate, getTournamentRegistrations);

userRouter.get('/notifications', authenticate, getUserNotifications);
userRouter.post('/notifications/:id/read', authenticate, markNotificationAsRead);

userRouter.get('/notification-settings', authenticate, getNotificationSettings);
userRouter.put('/notification-settings', authenticate, updateNotificationSettings);

// Wallet routes
userRouter.post('/wallet/deposit', authenticate, depositFunds);
userRouter.post('/wallet/withdraw', authenticate, withdrawFunds);
userRouter.get('/wallet/history', authenticate, getWalletHistory);
