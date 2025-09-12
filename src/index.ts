import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth.routes';
import adminRouter from './routes/admin.routes';
import { userRouter } from './routes/user.routes';
import roomRouter from './routes/room.routes';
import { initDB } from './models';
import cors from 'cors';
import { CronService } from './services/cron.service';
import { SchedulerService } from './services/scheduler.service';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerPokerGameHandlers } from './game/pokerSocket';
import { config } from './config/environment';
import { ensureDatabaseExists } from './config/database-setup';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', userRouter);
app.use('/api/rooms', roomRouter);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  }
});

const userSocketMap = new Map<number, string>();

io.on('connection', (socket: Socket) => {
  // Authenticate user using JWT from socket.handshake.auth.token
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload: any = jwt.verify(token, config.JWT_SECRET);
      const userId = payload.id;
      userSocketMap.set(userId, socket.id);
      // Store userId in socket for later use
      (socket as any).userId = userId;
    } catch (e) {
      socket.disconnect();
      return;
    }
  } else {
    socket.disconnect();
    return;
  }


  socket.on('disconnect', () => {
    const userId = (socket as any).userId;
    if (userId) {
      userSocketMap.delete(userId);
    }
  });
});

// Register poker game handlers on /poker namespace
const pokerNamespace = io.of('/poker');
registerPokerGameHandlers(pokerNamespace as any);

// Make io available for other modules
export { io, userSocketMap };

const PORT = config.PORT;
ensureDatabaseExists().then(() => {
  return initDB();
}).then(() => {
  server.listen(PORT, () => {
    SchedulerService.startNotificationScheduler();
    CronService.startTournamentStatusUpdates();
    console.log("<<<--------SERVER STARTED-------->>>");
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    SchedulerService.stopNotificationScheduler();
    CronService.stopTournamentStatusUpdates();
    // ... existing shutdown code ...
  });

  process.on('SIGINT', () => {
    SchedulerService.stopNotificationScheduler();
    CronService.stopTournamentStatusUpdates();
    // ... existing shutdown code ...
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
