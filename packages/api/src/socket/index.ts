import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  const origins = (process.env.SOCKET_CORS_ORIGINS || `${process.env.WEB_URL || ''},${process.env.ADMIN_URL || ''}`)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new SocketServer(httpServer, {
    cors: {
      origin: origins.length ? origins : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const userRole = (socket as any).userRole as string;

    socket.join(`user:${userId}`);

    socket.on('provider:location_update', (data: { bookingId: string; lat: number; lng: number }) => {
      if (userRole !== 'PROVIDER') return;
      io.to(`booking:${data.bookingId}`).emit('provider:location', {
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('booking:join', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('booking:leave', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${userId}`);
    });
  });

  return io;
}

export const socketEmit = {
  bookingStatusUpdated(bookingId: string, status: string, message: string): void {
    if (!io) return;
    io.to(`booking:${bookingId}`).emit('booking:status_updated', {
      bookingId,
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  },

  notifyUser(userId: string, event: string, data: any): void {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
  },

  newBookingRequest(providerId: string, booking: any): void {
    if (!io) return;
    io.to(`user:${providerId}`).emit('booking:new_request', booking);
  },

  paymentConfirmed(bookingId: string, amount: number): void {
    if (!io) return;
    io.to(`booking:${bookingId}`).emit('payment:confirmed', {
      bookingId,
      amount,
      timestamp: new Date().toISOString(),
    });
  },
};
