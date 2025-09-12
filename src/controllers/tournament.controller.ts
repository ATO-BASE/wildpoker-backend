import { Request, Response } from 'express';
import { Tournament, User, Registration } from '../models';
import { TournamentNotificationService } from '../services/tournament-notification.service';
import { RoomManagementService } from '../services/room-management.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

declare global {
  namespace Express {
    interface Request {
      admin?: { id: number };
    }
  }
}

const TournamentSchema = z.object({
  name: z.string().min(3),
  theme: z.string().optional(),
  startsAt: z.string().datetime(),
  entryFee: z.number().min(0),
  pool: z.number().min(0).optional(),
  startingStack: z.number().int().positive(),
  maxPlayers: z.number().int().positive().optional(),
  lateRegMin: z.number().int().min(0),
  duration: z.number().int().positive(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']),
  prizeStructure: z.array(z.object({
    place: z.number().int().min(1),
    pct: z.number().min(0).max(100)
  })),
});

export const createTournament = async (req: Request, res: Response) => {
  try {
    const parsedBody = {
      ...req.body,
      entryFee: parseFloat(req.body.entryFee) || 0,
      pool: 0, // Initialize pool to 0
      startingStack: parseInt(req.body.startingStack),
      maxPlayers: req.body.maxPlayers ? parseInt(req.body.maxPlayers) : undefined,
      lateRegMin: parseInt(req.body.lateRegMin),
      duration: parseInt(req.body.duration),
      repeat: req.body.repeat || 'none',
      prizeStructure: [], // default empty, can enhance later
      startsAt: req.body.startsAt, // keep as string for validation
    };

    const result = TournamentSchema.safeParse(parsedBody);

    if (!result.success) {
      res.status(400).json({ error: result.error.format() });
      return;
    }

    if (!req.admin) {
      res.status(401).json({ error: "Unauthorized: admin not found" });
      return;
    }


    // Check if admin user exists in database
    const adminUser = await User.findByPk(req.admin.id);

    if (!adminUser) {
      res.status(401).json({ error: "Unauthorized: admin user not found in database" });
      return;
    }

     const tournament = await Tournament.create({
      ...result.data,
      entryFee: String(result.data.entryFee),
      pool: String(result.data.pool || 0),
      createdBy: req.admin.id,
      status: 'registering',
      banner: req.file ? req.file.path : "",
      startsAt: new Date(result.data.startsAt) // convert to Date here
    });

    // Send notification to all users about the new tournament
    // Note: Tournament created notification (type 0) will be sent when users register
    // For now, we'll send a general notification to all users
    await TournamentNotificationService.sendTournamentCreatedNotification(tournament, []);

    // Start room monitoring for the new tournament
    try {
      await RoomManagementService.startTournamentMonitoring(tournament.id);
      console.log(`🏠 Started room monitoring for new tournament ${tournament.id}`);
    } catch (roomError) {
      console.error(`Error starting room monitoring for tournament ${tournament.id}:`, roomError);
      // Don't fail tournament creation if room monitoring fails
    }

    res.status(201).json({ message: "Tournament created", tournament });
  } catch (err: any) {
    console.error("Tournament Create Error:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllTournamentsPublic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const tournaments = await Tournament.findAll({
      order: [['startsAt', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['username'] },
        {
          model: Registration,
          include: [{ model: User, attributes: ['id', 'username', 'avatar','country','email'] }]
        }
      ]
    });

    const userRegistrations = await Registration.findAll({
      where: { userId },
      attributes: ['tournamentId']
    });
    const registeredTournamentIds = new Set(userRegistrations.map(r => r.tournamentId));

    const tournamentsWithStatus = tournaments.map(tournament => {
      const tournamentJSON = tournament.toJSON();
      const t: any = tournamentJSON;
      // Simplify the registrations to a list of players
      const players = t.registrations ? t.registrations.map((r: any) => r.User) : [];
      return {
        ...tournamentJSON,
        isRegistered: registeredTournamentIds.has(tournament.id),
        players
      };
    });

    res.status(200).json(tournamentsWithStatus);
  } catch (err) {
    console.error("Get All Tournaments (Public) Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllTournaments = async (req: Request, res: Response) => {
  try {
    const tournaments = await Tournament.findAll({
      order: [['startsAt', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['username'] },
        { 
          model: Registration,
          include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
        }
      ]
    });

    const tournamentsWithPlayers = tournaments.map(tournament => {
      const tournamentJSON = tournament.toJSON();
      const t: any = tournamentJSON;
      
      // Simplify the registrations to a list of players
      const players = t.registrations ? t.registrations.map((r: any) => r.User) : [];
      
      return {
        ...tournamentJSON,
        players
      };
    });

    res.status(200).json(tournamentsWithPlayers);
  } catch (err) {
    console.error("Get All Tournaments Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTournamentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['username'] },
        {
          model: Registration,
          include: [{ model: User, attributes: ['id', 'username', 'avatar','country', 'email'] }]
        }
      ]
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const tournamentJSON = tournament.toJSON();
    const t: any = tournamentJSON;

    // Simplify the registrations to a list of players
    const players = t.registrations ? t.registrations.map((r: any) => r.User) : [];


    res.status(200).json({ ...tournamentJSON, players });
  } catch (err) {
    console.error("Get Tournament by ID error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTournamentRegistrations = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const registrations = await Registration.findAll({
      where: { tournamentId: id },
      include: [{ model: User, attributes: ['id', 'username', 'email', 'country', 'avatar'] }],
    });


    // Return the full registration objects (with User included)
    res.status(200).json({ registrations });
  } catch (err) {
    console.error('Error in getTournamentRegistrations:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeTournamentRegistration = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const registration = await require('../models').Registration.findByPk(registrationId);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    await registration.destroy();
    res.status(200).json({ message: 'Player removed from tournament' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//-------------------------------Enter Lobby function for players
export const enterLobby = async (req: AuthRequest, res: Response) => {
  try {
    const { tournamentId: tournamentIdStr } = req.params;
    const tournamentId = parseInt(tournamentIdStr, 10);
    const userId = req.user!.id;

    if (isNaN(tournamentId)) {
      res.status(400).json({ error: 'Invalid tournament ID' });
      return;
    }

    // Check if tournament exists
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Check if user is registered for this tournament
    const registration = await Registration.findOne({
      where: {
        tournamentId,
        userId,
        status: 'registered'
      }
    });

    if (!registration) {
      res.status(400).json({ error: 'You are not registered for this tournament' });
      return;
    }

    // Check if tournament has started
    const now = new Date();
    if (now < tournament.startsAt) {
      res.status(400).json({ error: 'Tournament has not started yet' });
      return;
    }

    // Check if late registration period has expired
    const lateRegEndTime = new Date(tournament.startsAt.getTime() + (tournament.lateRegMin * 60 * 1000));
    if (now > lateRegEndTime) {
      res.status(400).json({ error: 'Late registration period has expired' });
      return;
    }

    // Update registration status to 'in_lobby' to indicate player is waiting in lobby
    await registration.update({
      status: 'in_lobby'
    });

    // Update user's tournament state
    await User.update({
      currentTournamentId: tournamentId,
      tournamentState: 'in_lobby'
    }, {
      where: { id: userId }
    });

    console.log(`🎮 User ${userId} entered lobby for tournament ${tournamentId}`);

    // Trigger room monitoring to create rooms if needed
    console.log(`🎯 Triggering room monitoring for tournament ${tournamentId}`);
    const { RoomManagementService } = await import('../services/room-management.service');
    await RoomManagementService.monitorTournamentRegistrations(tournamentId);
    console.log(`✅ Room monitoring completed for tournament ${tournamentId}`);

    res.status(200).json({ 
      message: 'Successfully entered lobby',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status
      }
    });

  } catch (error) {
    console.error('Error entering lobby:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



//-------------------------------This is tournament USER resgistration function in backend.
export const registerForTournament = async (req: AuthRequest, res: Response) => {
  try {

    const { tournamentId: tournamentIdStr } = req.params;   

    const { userResultBalance } = req.body;

    const tournamentId = parseInt(tournamentIdStr, 10);

    const userId = req.user!.id;

    if (isNaN(tournamentId)) {
      res.status(400).json({ error: 'Invalid tournament ID' });
      return;
    }

    // Check if tournament exists
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get current user balance from database
    const currentUserBalance = parseFloat(user.balance || '0');
    const tournamentEntryFee = parseFloat(tournament.entryFee);
    const tournamentStartingStack = parseFloat(String(tournament.startingStack));

    console.log("Balance validation:", {
      currentUserBalance,
      tournamentEntryFee,
      tournamentStartingStack,
      userResultBalance
    });

    // Validate user has enough balance for entry fee
    if (currentUserBalance < tournamentEntryFee) {
      res.status(400).json({ 
        error: `Insufficient balance. You need ${tournamentEntryFee} USDT to register. Your current balance: ${currentUserBalance} USDT` 
      });
      return;
    }

    // Validate user has enough balance for starting stack (if different from entry fee)
    if (tournamentStartingStack > tournamentEntryFee && currentUserBalance < tournamentStartingStack) {
      res.status(400).json({ 
        error: `Insufficient balance for tournament starting stack. You need at least ${tournamentStartingStack} USDT to register. Your current balance: ${currentUserBalance} USDT` 
      });
      return;
    }

    // Validate the calculated balance from frontend
    if(parseFloat(userResultBalance) < 0){
      res.status(400).json({error: 'Your balance is lower than tournament fee.'});
      return;
    } 

    console.log("--->>>receive data from tournament registration function ", userResultBalance);
    console.log("tournamentid , userID, and User result balance", tournamentId, userId, userResultBalance);
    console.log("tournament --->>>", tournament);

    const user_balance_update = await user.update({balance: userResultBalance.toFixed(2)});

    console.log("User updated result --->>>", user_balance_update);
    
    // Add entry fee to tournament pool
    const currentPool = parseFloat(tournament.pool || '0');
    const newPool = currentPool + tournamentEntryFee;
    
    await tournament.update({ pool: newPool.toFixed(2) });
    console.log(`Added ${tournamentEntryFee} to tournament pool. New pool: ${newPool}`);
    
    // Create registration
    const registration = await Registration.create({
      tournamentId,
      userId,
      status: 'registered',
      stack: String(tournament.startingStack)
    });

    // Send tournament created notification (type 0) to the newly registered user
    await TournamentNotificationService.sendTournamentCreatedNotification(tournament, [userId]);

    // Trigger room management to create/update rooms based on new registration
    try {
      await RoomManagementService.monitorTournamentRegistrations(tournamentId);
      console.log(`🏠 Room management triggered for tournament ${tournamentId} after user ${userId} registration`);
    } catch (roomError) {
      console.error(`Error in room management for tournament ${tournamentId}:`, roomError);
      // Don't fail the registration if room management fails
    }

    res.status(201).json({
      message: 'Successfully registered for tournament',
      registration,
      remainingBalance: userResultBalance,
      currency: 'USDT',
      tournamentPool: newPool.toFixed(2)
    });
  } catch (error) {
    console.error('Tournament registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
//------------------------------------------------------------------------------------//


export const unregisterFromTournament = async (req: AuthRequest, res: Response) => {
  try {
    const { tournamentId: tournamentIdStr } = req.params;
    const tournamentId = parseInt(tournamentIdStr, 10);
    const userId = req.user!.id;

    if (isNaN(tournamentId)) {
      res.status(400).json({ error: 'Invalid tournament ID' });
      return;
    }

    // Check if tournament exists
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Check if user is registered
    const existingRegistration = await Registration.findOne({
      where: { tournamentId, userId }
    });

    if (!existingRegistration) {
      res.status(400).json({ error: 'Not registered for this tournament' });
      return;
    }

    // Check if tournament has already started (can't unregister after start)
    const now = new Date();
    const tournamentStartTime = new Date(tournament.startsAt);

    if (now >= tournamentStartTime) {
      res.status(400).json({ error: 'Cannot unregister after tournament has started' });
      return;
    }

    // Remove registration
    await existingRegistration.destroy();

    res.status(200).json({
      message: 'Successfully unregistered from tournament'
    });
  } catch (error) {
    console.error('Tournament unregistration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTournamentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['registering', 'running', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be one of: registering, running, completed, cancelled' });
      return;
    }

    // Check if tournament exists
    const tournament = await Tournament.findByPk(id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Update the status
    await tournament.update({ status });

    res.status(200).json({
      message: 'Tournament status updated successfully',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status
      }
    });
  } catch (error) {
    console.error('Tournament status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTournament = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Backend: Delete tournament request for ID:', id);

    // Check if tournament exists
    const tournament = await Tournament.findByPk(id, {
      include: [
        { model: Registration, include: [{ model: User }] }
      ]
    });

    if (!tournament) {
      console.log('❌ Backend: Tournament not found for ID:', id);
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    console.log('✅ Backend: Tournament found:', {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status
    });

    // Check if tournament has registrations
    const registrations = await Registration.findAll({
      where: { tournamentId: id }
    });

    console.log('📊 Backend: Tournament registrations count:', registrations.length);

    if (registrations.length > 0) {
      console.log('❌ Backend: Cannot delete - tournament has registrations');
      res.status(400).json({ 
        error: 'Cannot delete tournament with existing registrations. Please remove all registrations first or cancel the tournament.' 
      });
      return;
    }

    // Check if tournament is currently running
    if (tournament.status === 'running') {
      console.log('❌ Backend: Cannot delete - tournament is running');
      res.status(400).json({ 
        error: 'Cannot delete a running tournament. Please wait for it to complete or cancel it first.' 
      });
      return;
    }

    console.log('✅ Backend: Proceeding with tournament deletion');
    
    // Delete the tournament
    await tournament.destroy();

    console.log('✅ Backend: Tournament deleted successfully');

    res.status(200).json({
      message: 'Tournament deleted successfully',
      deletedTournament: {
        id: tournament.id,
        name: tournament.name
      }
    });
  } catch (error) {
    console.error('❌ Backend: Tournament deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
