import { Op } from 'sequelize';
import { Room, Tournament, Registration, User } from '../models';
import { io, userSocketMap } from '../index';

export interface RoomCreationConfig {
  playersPerRoom: number;
  minPlayersToStart: number;
  maxRoomsPerTournament: number;
}

export class RoomManagementService {
  private static readonly DEFAULT_CONFIG: RoomCreationConfig = {
    playersPerRoom: 8, // Standard poker table size
    minPlayersToStart: 2,
    maxRoomsPerTournament: 50 // Prevent unlimited room creation
  };

  /**
   * Monitor tournament registrations and create rooms automatically
   * Implements the specific algorithm: if(all-player % 8 > 4)create(all-player / 8 + 1); else if(all-player % 8 < 4)create(all-player / 8);
   */
  static async monitorTournamentRegistrations(tournamentId: number): Promise<void> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        console.log(`Tournament ${tournamentId} not found`);
        return;
      }

      // Check if late registration period has expired
      const now = new Date();
      const lateRegEndTime = new Date(tournament.startsAt.getTime() + (tournament.lateRegMin * 60 * 1000));
      
      // Only create rooms after late registration period expires OR if tournament is running
      if (now < lateRegEndTime && tournament.status !== 'running') {
        console.log(`⏰ Tournament ${tournamentId} still in late registration period`);
        return;
      }

      // Get all users in lobby for this tournament (players who entered lobby)
      const lobbyRegistrations = await Registration.findAll({
        where: {
          tournamentId,
          status: 'in_lobby'
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName']
        }]
      });

      const lobbyUserIds = lobbyRegistrations.map(r => r.userId);
      console.log(`🎮 Tournament ${tournamentId} has ${lobbyUserIds.length} players in lobby`);

      // Get existing rooms for this tournament
      const existingRooms = await Room.findAll({
        where: {
          tournamentId,
          roomState: {
            [Op.in]: ['waiting', 'playing']
          }
        }
      });

      const totalPlayers = lobbyUserIds.length;
      const playersPerRoom = 8; // Fixed at 8 players per room
      
      // Implement the specific algorithm
      let roomsToCreate = 0;
      if (totalPlayers > 0) {
        const remainder = totalPlayers % playersPerRoom;
        if (remainder > 4) {
          roomsToCreate = Math.floor(totalPlayers / playersPerRoom) + 1;
        } else if (remainder < 4) {
          roomsToCreate = Math.floor(totalPlayers / playersPerRoom);
        } else {
          // remainder == 4, create rooms based on total players
          roomsToCreate = Math.floor(totalPlayers / playersPerRoom);
        }
      }

      const currentRooms = existingRooms.length;
      console.log(`🏠 Tournament ${tournamentId}: Algorithm calculated ${roomsToCreate} rooms needed, currently have ${currentRooms}`);

      // Create additional rooms if needed
      if (roomsToCreate > currentRooms && roomsToCreate <= this.DEFAULT_CONFIG.maxRoomsPerTournament) {
        const roomsToCreateCount = roomsToCreate - currentRooms;
        console.log(`🆕 Creating ${roomsToCreateCount} new rooms for tournament ${tournamentId}`);

        for (let i = 0; i < roomsToCreateCount; i++) {
          await this.createRoomForTournament(tournamentId, i + currentRooms + 1);
        }

        // Emit real-time update to all connected users
        await this.emitRoomUpdate(tournamentId);
      }

      // Distribute players to rooms
      await this.distributePlayersToRooms(tournamentId, lobbyUserIds, existingRooms);

      // Update room states based on player count
      await this.updateRoomStates(tournamentId);

    } catch (error) {
      console.error(`Error monitoring tournament ${tournamentId}:`, error);
    }
  }

  /**
   * Update room states based on player count and game rules
   */
  private static async updateRoomStates(tournamentId: number): Promise<void> {
    try {
      const rooms = await Room.findAll({
        where: {
          tournamentId,
          roomState: {
            [Op.in]: ['waiting', 'playing']
          }
        }
      });

      for (const room of rooms) {
        const playerCount = room.roomMembers.length;
        
        if (playerCount >= room.maxMembers && room.roomState === 'waiting') {
          // Room is full, start the game
          await room.update({ roomState: 'playing' });
          console.log(`🎮 Room ${room.id} started playing with ${playerCount} players`);
          
          // Update player registrations to 'playing' status
          await Registration.update(
            { status: 'playing' },
            {
              where: {
                tournamentId,
                userId: {
                  [Op.in]: room.roomMembers
                }
              }
            }
          );
        } else if (playerCount < 4 && room.roomState === 'playing') {
          // Less than 4 players, disband the room
          await room.update({ roomState: 'cancelled' });
          console.log(`🔄 Room ${room.id} disbanded due to insufficient players (${playerCount})`);
          
          // Move players back to lobby status
          await Registration.update(
            { status: 'in_lobby' },
            {
              where: {
                tournamentId,
                userId: {
                  [Op.in]: room.roomMembers
                }
              }
            }
          );
        }
      }

      // Emit room updates after state changes
      await this.emitRoomUpdate(tournamentId);
    } catch (error) {
      console.error(`Error updating room states for tournament ${tournamentId}:`, error);
    }
  }

  /**
   * Create a new room for a tournament
   */
  private static async createRoomForTournament(
    tournamentId: number, 
    roomNumber: number
  ): Promise<Room> {
    const roomPassword = this.generateRoomPassword();

    const room = await Room.create({
      tournamentId,
      roomMembers: [],
      roomPassword,
      roomState: 'waiting',
      maxMembers: this.DEFAULT_CONFIG.playersPerRoom,
      minMembers: this.DEFAULT_CONFIG.minPlayersToStart,
      createdBy: 1 // System user (you might want to create a system user)
    });

    console.log(`✅ Created room ${room.id} (${tournamentId}-${roomNumber}) for tournament ${tournamentId}`);
    return room;
  }

  /**
   * Distribute registered players across available rooms
   */
  private static async distributePlayersToRooms(
    tournamentId: number,
    playerIds: number[],
    rooms: Room[]
  ): Promise<void> {
    if (rooms.length === 0 || playerIds.length === 0) return;

    // Get current room assignments
    const roomAssignments = new Map<number, number[]>(); // roomId -> userIds[]
    
    for (const room of rooms) {
      roomAssignments.set(room.id, [...room.roomMembers]);
    }

    // Distribute players evenly across rooms
    let roomIndex = 0;
    for (const playerId of playerIds) {
      // Check if player is already assigned to a room
      let alreadyAssigned = false;
      for (const assignedPlayers of roomAssignments.values()) {
        if (assignedPlayers.includes(playerId)) {
          alreadyAssigned = true;
          break;
        }
      }

      if (!alreadyAssigned) {
        const room = rooms[roomIndex % rooms.length];
        const currentPlayers = roomAssignments.get(room.id) || [];
        
        if (currentPlayers.length < room.maxMembers) {
          currentPlayers.push(playerId);
          roomAssignments.set(room.id, currentPlayers);
          
          // Update room in database
          await Room.update(
            { roomMembers: currentPlayers },
            { where: { id: room.id } }
          );
        }
        
        roomIndex++;
      }
    }

    console.log(`👥 Distributed ${playerIds.length} players across ${rooms.length} rooms`);
  }

  /**
   * Generate a secure room password
   */
  private static generateRoomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Emit real-time room updates to all connected users
   */
  private static async emitRoomUpdate(tournamentId: number): Promise<void> {
    try {
      // Get updated room data
      const rooms = await Room.findAll({
        where: { tournamentId },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName']
        }]
      });

      // Get all registered users for this tournament
      const registrations = await Registration.findAll({
        where: { tournamentId },
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName']
        }]
      });

      const roomData = {
        tournamentId,
        rooms: rooms.map(room => ({
          id: room.id,
          roomId: `${tournamentId}-${room.id}`,
          roomMembers: room.roomMembers,
          roomState: room.roomState,
          maxMembers: room.maxMembers,
          minMembers: room.minMembers,
          createdDate: room.createdDate,
          creator: room.creator
        })),
        totalRegisteredPlayers: registrations.length,
        totalRooms: rooms.length
      };

      // Emit to all connected users
      io.emit('tournament:roomsUpdate', roomData);
      
      // Also emit to specific tournament namespace if it exists
      const tournamentNamespace = io.of(`/tournament-${tournamentId}`);
      tournamentNamespace.emit('roomsUpdate', roomData);

      console.log(`📡 Emitted room update for tournament ${tournamentId}`);
    } catch (error) {
      console.error(`Error emitting room update for tournament ${tournamentId}:`, error);
    }
  }

  /**
   * Search rooms by ID or tournament
   */
  static async searchRooms(searchTerm: string, tournamentId?: number): Promise<Room[]> {
    const whereClause: any = {};

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    // If search term is numeric, search by room ID
    if (/^\d+$/.test(searchTerm)) {
      whereClause.id = parseInt(searchTerm, 10);
    } else {
      // Search by room ID pattern (e.g., "1-001")
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    return await Room.findAll({
      where: whereClause,
      include: [{
        model: Tournament,
        attributes: ['id', 'name', 'status']
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName']
      }],
      order: [['createdDate', 'DESC']]
    });
  }

  /**
   * Get room statistics for a tournament
   */
  static async getTournamentRoomStats(tournamentId: number): Promise<{
    totalRooms: number;
    activeRooms: number;
    totalPlayers: number;
    averagePlayersPerRoom: number;
    rooms: Array<{
      id: number;
      roomId: string;
      playerCount: number;
      maxPlayers: number;
      state: string;
    }>;
  }> {
    const rooms = await Room.findAll({
      where: { tournamentId },
      include: [{
        model: Tournament,
        attributes: ['id', 'name']
      }]
    });

    const registrations = await Registration.findAll({
      where: { tournamentId }
    });

    const totalPlayers = registrations.length;
    const totalRooms = rooms.length;
    const activeRooms = rooms.filter(r => r.roomState === 'playing').length;
    const averagePlayersPerRoom = totalRooms > 0 ? totalPlayers / totalRooms : 0;

    return {
      totalRooms,
      activeRooms,
      totalPlayers,
      averagePlayersPerRoom,
      rooms: rooms.map(room => ({
        id: room.id,
        roomId: `${tournamentId}-${room.id}`,
        playerCount: room.roomMembers.length,
        maxPlayers: room.maxMembers,
        state: room.roomState
      }))
    };
  }

  /**
   * Start monitoring for a specific tournament
   */
  static async startTournamentMonitoring(tournamentId: number): Promise<void> {
    console.log(`🎯 Starting room monitoring for tournament ${tournamentId}`);
    
    // Initial room creation check
    await this.monitorTournamentRegistrations(tournamentId);
    
    // Set up periodic monitoring (every 30 seconds)
    const monitoringInterval = setInterval(async () => {
      try {
        await this.monitorTournamentRegistrations(tournamentId);
      } catch (error) {
        console.error(`Error in tournament ${tournamentId} monitoring:`, error);
      }
    }, 30000);

    // Store interval reference for cleanup
    (this as any).monitoringIntervals = (this as any).monitoringIntervals || new Map();
    (this as any).monitoringIntervals.set(tournamentId, monitoringInterval);
  }

  /**
   * Stop monitoring for a specific tournament
   */
  static async stopTournamentMonitoring(tournamentId: number): Promise<void> {
    console.log(`🛑 Stopping room monitoring for tournament ${tournamentId}`);
    
    const intervals = (this as any).monitoringIntervals;
    if (intervals && intervals.has(tournamentId)) {
      clearInterval(intervals.get(tournamentId));
      intervals.delete(tournamentId);
    }
  }
}

