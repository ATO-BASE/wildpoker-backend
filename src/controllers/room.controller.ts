// src/controllers/room.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Room, Tournament, User, sequelize } from '../models';
import { Op } from 'sequelize';
import { RoomManagementService } from '../services/room-management.service';

export class RoomController {
  // Create a new room
  static async createRoom(req: Request, res: Response, _next: NextFunction): Promise<void> {
    console.log("****************This is the create Room controller.***************")
    console.log("CREATE ROOM API CALLED-------------------------", "req.body", req.body);
  }

  // Get all rooms for a tournament
  static async getTournamentRooms(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;

      console.log(`🔍 Fetching rooms for tournament ${tournamentId}`);

      const rooms = await Room.findAll({
        where: { tournamentId: parseInt(tournamentId) },
        include: [
          {
            model: Tournament,
            attributes: ['name', 'status']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'avatar']
          }
        ],
        order: [['createdDate', 'DESC']]
      });

      console.log(`📊 Found ${rooms.length} rooms for tournament ${tournamentId}`);
      console.log('Rooms:', rooms.map(r => ({ id: r.id, members: r.roomMembers.length, state: r.roomState })));

      res.json({ rooms });
    } catch (error) {
      console.error('Error fetching tournament rooms:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get room details
  static async getRoomDetails(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;

      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: Tournament,
            attributes: ['name', 'status', 'entryFee', 'currency']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
      }

      res.json({ room });
    } catch (error) {
      console.error('Error fetching room details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Join a room
  static async joinRoom(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const { password } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
      }

      // Check password
      if (room.roomPassword !== password) {
        res.status(401).json({ message: 'Incorrect room password' });
        return;
      }

      // Check if user is already in the room
      if (room.roomMembers.includes(userId)) {
        res.status(400).json({ message: 'User already in room' });
        return;
      }

      // Check if room is full
      if (room.roomMembers.length >= room.maxMembers) {
        res.status(400).json({ message: 'Room is full' });
        return;
      }

      // Check if room is accepting members
      if (room.roomState !== 'waiting') {
        res.status(400).json({ message: 'Room is not accepting new members' });
        return;
      }

      // Add user to room
      await room.update({
        roomMembers: [...room.roomMembers, userId]
      });

      // Update user's room state
      await User.update({
        currentRoomId: parseInt(roomId),
        currentTournamentId: room.tournamentId,
        roomState: 'waiting',
        tournamentState: 'registered'
      }, {
        where: { id: userId }
      });

      res.json({
        message: 'Successfully joined room',
        room: {
          id: room.id,
          roomMembers: room.roomMembers,
          roomState: room.roomState
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Leave a room
  static async leaveRoom(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
      }

      // Check if user is in the room
      if (!room.roomMembers.includes(userId)) {
        res.status(400).json({ message: 'User not in room' });
        return;
      }

      // Remove user from room
      const updatedMembers = room.roomMembers.filter(id => id !== userId);
      
      // If room becomes empty, delete it
      if (updatedMembers.length === 0) {
        await room.destroy();
        res.json({ message: 'Room deleted as it became empty' });
        return;
      }

      // If creator leaves, assign new creator
      let newCreator = room.createdBy;
      if (room.createdBy === userId) {
        newCreator = updatedMembers[0];
      }

      await room.update({
        roomMembers: updatedMembers,
        createdBy: newCreator
      });

      // Update user's room state to 'left'
      await User.update({
        roomState: 'left'
      }, {
        where: { id: userId }
      });

      // If user is not in any other rooms for this tournament, clear tournament state
      const otherRooms = await Room.findAll({
        where: {
          tournamentId: room.tournamentId,
          roomMembers: { [Op.contains]: [userId] }
        }
      });

      if (otherRooms.length === 0) {
        await User.update({
          currentTournamentId: sequelize.literal('NULL'),
          tournamentState: 'left'
        }, {
          where: { id: userId }
        });
      }

      res.json({
        message: 'Successfully left room',
        room: {
          id: room.id,
          roomMembers: room.roomMembers,
          roomState: room.roomState
        }
      });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Update room state
  static async updateRoomState(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const { roomState } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
      }

      // Only room creator can change state
      if (room.createdBy !== userId) {
        res.status(403).json({ message: 'Only room creator can change room state' });
        return;
      }

      // Validate state transition
      const validTransitions: { [key: string]: string[] } = {
        'waiting': ['playing', 'cancelled'],
        'playing': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };

      if (!validTransitions[room.roomState].includes(roomState)) {
        res.status(400).json({ 
          message: `Invalid state transition from ${room.roomState} to ${roomState}` 
        });
        return;
      }

      await room.update({ roomState });

      // Update all users in the room to match the new state
      await User.update({
        roomState: roomState
      }, {
        where: {
          id: { [Op.in]: room.roomMembers }
        }
      });

      res.json({
        message: 'Room state updated successfully',
        room: {
          id: room.id,
          roomState: room.roomState
        }
      });
    } catch (error) {
      console.error('Error updating room state:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get user's current room and tournament state
  static async getUserState(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const user = await User.findByPk(userId, {
        attributes: ['currentRoomId', 'currentTournamentId', 'roomState', 'tournamentState']
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        userState: {
          currentRoomId: user.currentRoomId,
          currentTournamentId: user.currentTournamentId,
          roomState: user.roomState,
          tournamentState: user.tournamentState
        }
      });
    } catch (error) {
      console.error('Error fetching user state:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Leave tournament (removes user from all rooms in tournament)
  static async leaveTournament(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Find all rooms in the tournament that contain this user
      const rooms = await Room.findAll({
        where: {
          tournamentId: parseInt(tournamentId),
          roomMembers: { [Op.contains]: [userId] }
        }
      });

      // Remove user from all rooms
      for (const room of rooms) {
        const updatedMembers = room.roomMembers.filter(id => id !== userId);
        
        if (updatedMembers.length === 0) {
          // Delete empty room
          await room.destroy();
        } else {
          // Assign new creator if needed
          let newCreator = room.createdBy;
          if (room.createdBy === userId) {
            newCreator = updatedMembers[0];
          }
          
          await room.update({
            roomMembers: updatedMembers,
            createdBy: newCreator
          });
        }
      }

      // Update user's tournament state
      await User.update({
        currentTournamentId: sequelize.literal('NULL'),
        tournamentState: 'left',
        currentRoomId: sequelize.literal('NULL'),
        roomState: 'left'
      }, {
        where: { id: userId }
      });

      res.json({ message: 'Successfully left tournament' });
    } catch (error) {
      console.error('Error leaving tournament:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Delete room (only creator can delete)
  static async deleteRoom(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
      }

      // Only room creator can delete
      if (room.createdBy !== userId) {
        res.status(403).json({ message: 'Only room creator can delete room' });
        return;
      }

      await room.destroy();

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Search rooms by ID or tournament
  static async searchRooms(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { searchTerm, tournamentId } = req.query;
      
      if (!searchTerm) {
        res.status(400).json({ message: 'Search term is required' });
        return;
      }

      const rooms = await RoomManagementService.searchRooms(
        searchTerm as string,
        tournamentId ? parseInt(tournamentId as string) : undefined
      );

      res.json({
        message: 'Rooms found',
        rooms: rooms.map(room => ({
          id: room.id,
          roomId: `${room.tournamentId}-${room.id}`,
          tournamentId: room.tournamentId,
          roomMembers: room.roomMembers,
          roomState: room.roomState,
          maxMembers: room.maxMembers,
          minMembers: room.minMembers,
          createdDate: room.createdDate,
          Tournament: room.Tournament,
          creator: room.creator
        }))
      });
    } catch (error) {
      console.error('Error searching rooms:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get tournament room statistics
  static async getTournamentRoomStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      
      const stats = await RoomManagementService.getTournamentRoomStats(parseInt(tournamentId));
      
      res.json({
        message: 'Tournament room statistics',
        stats
      });
    } catch (error) {
      console.error('Error getting tournament room stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Start tournament room monitoring
  static async startTournamentMonitoring(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      
      await RoomManagementService.startTournamentMonitoring(parseInt(tournamentId));
      
      res.json({
        message: `Room monitoring started for tournament ${tournamentId}`
      });
    } catch (error) {
      console.error('Error starting tournament monitoring:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Stop tournament room monitoring
  static async stopTournamentMonitoring(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      
      await RoomManagementService.stopTournamentMonitoring(parseInt(tournamentId));
      
      res.json({
        message: `Room monitoring stopped for tournament ${tournamentId}`
      });
    } catch (error) {
      console.error('Error stopping tournament monitoring:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Manual trigger for room creation (for testing)
  static async triggerRoomCreation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      console.log(`🚀 Manual trigger for room creation - Tournament ${tournamentId}`);

      const { RoomManagementService } = await import('../services/room-management.service');
      await RoomManagementService.monitorTournamentRegistrations(parseInt(tournamentId));

      res.json({ message: 'Room creation triggered successfully' });
    } catch (error) {
      console.error('Error triggering room creation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}