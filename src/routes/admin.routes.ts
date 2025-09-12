import express from 'express';
import { createTournament, getAllTournaments, getTournamentById, getTournamentRegistrations, removeTournamentRegistration, updateTournamentStatus, deleteTournament } from '../controllers/tournament.controller';
import { authenticateAdmin } from '../middleware/authenticateAdmin';
import { listAllTransactions } from '../controllers/transaction.controller';
// import { getAllRegisteredUsers } from '../controllers/registeration.controller';
import { listAllUsers, getUserProfile, getDashboardStats, adminRegister, getCurrentAdmin, updateUser, deleteUser, getNotificationSettings, updateNotificationSettings, adminSendNotification } from '../controllers/admin.controller';
import { verifyEmail } from '../controllers/auth.controller';
import { User, sequelize } from '../models';
import { upload } from '../middleware/upload.middleware';

const adminRouter = express.Router();

// Admin registration (no authentication required for registration)
adminRouter.post('/register', adminRegister);

// Admin email verification
adminRouter.post('/verify-email', verifyEmail);

adminRouter.get('/me', authenticateAdmin, getCurrentAdmin);
adminRouter.get('/stats', authenticateAdmin, getDashboardStats);
adminRouter.post('/create',authenticateAdmin,upload.single('banner'),  createTournament);
adminRouter.get('/tournaments', authenticateAdmin, getAllTournaments);
adminRouter.get('/tournaments/:id', authenticateAdmin, getTournamentById);
adminRouter.get('/tournaments/:id/registrations', authenticateAdmin, getTournamentRegistrations);
adminRouter.get('/transactions',authenticateAdmin, listAllTransactions);
// adminRouter.get('/registrations',authenticateAdmin, getAllRegisteredUsers);
adminRouter.get('/users', authenticateAdmin, listAllUsers);
adminRouter.get('/users/:id', authenticateAdmin, getUserProfile);
adminRouter.put('/users/:id', authenticateAdmin, updateUser);
adminRouter.delete('/users/:id', authenticateAdmin, deleteUser);
adminRouter.delete('/tournaments/:tournamentId/registrations/:registrationId', authenticateAdmin, removeTournamentRegistration);

// Notification Settings Routes
adminRouter.get('/notification-settings', authenticateAdmin, getNotificationSettings);
adminRouter.put('/notification-settings', authenticateAdmin, updateNotificationSettings);

// Admin notification route
adminRouter.post('/notifications', authenticateAdmin, adminSendNotification);

adminRouter.put('/tournaments/:id/status', authenticateAdmin, updateTournamentStatus);
adminRouter.delete('/tournaments/:id', authenticateAdmin, deleteTournament);

export default adminRouter;
