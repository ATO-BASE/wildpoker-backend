import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate as authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all room routes
router.use(authenticateToken);

// Room CRUD operations
router.post('/create', (req, res, next) => RoomController.createRoom(req, res, next));
router.get('/tournament/:tournamentId', (req, res, next) => RoomController.getTournamentRooms(req, res, next));
router.get('/:roomId', (req, res, next) => RoomController.getRoomDetails(req, res, next));
router.post('/:roomId/join', (req, res, next) => RoomController.joinRoom(req, res, next));
router.post('/:roomId/leave', (req, res, next) => RoomController.leaveRoom(req, res, next));
router.put('/:roomId/state', (req, res, next) => RoomController.updateRoomState(req, res, next));
router.delete('/:roomId', (req, res, next) => RoomController.deleteRoom(req, res, next));

// User state management
router.get('/user/state', (req, res, next) => RoomController.getUserState(req, res, next));
router.post('/tournament/:tournamentId/leave', (req, res, next) => RoomController.leaveTournament(req, res, next));

// Dynamic room management
router.get('/search', (req, res, next) => RoomController.searchRooms(req, res, next));
router.get('/tournament/:tournamentId/stats', (req, res, next) => RoomController.getTournamentRoomStats(req, res, next));
router.post('/tournament/:tournamentId/start-monitoring', (req, res, next) => RoomController.startTournamentMonitoring(req, res, next));
router.post('/tournament/:tournamentId/stop-monitoring', (req, res, next) => RoomController.stopTournamentMonitoring(req, res, next));
router.post('/tournament/:tournamentId/trigger-creation', (req, res, next) => RoomController.triggerRoomCreation(req, res, next));

export default router;
