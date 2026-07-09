import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

export const initSocketServer = (server: HttpServer) => {
  const allowedOrigins =
    process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = allowedOrigins.split(',');

  io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie || '';
        token = cookieHeader
          .split('; ')
          .find((row) => row.startsWith('accessToken='))
          ?.split('=')[1];
      }

      if (!token) {
        return next(new Error('Authentication failed: No token'));
      }

      if (!process.env.ACCESS_TOKEN_SECRET) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as any;
      socket.data = { userId: decoded.userId };
      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io has not been initialized!');
  return io;
};

export const notifyUserMailUpdate = (userId: string, unreadCount: number) => {
  if (io) {
    io.to(`user:${userId}`).emit('mail_unread_count', { unreadCount });
  }
};
