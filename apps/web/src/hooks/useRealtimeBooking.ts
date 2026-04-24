import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000', {
    transports: ['websocket'],
    autoConnect: false,
    auth: {
      token: localStorage.getItem('accessToken') || '',
    },
  });

  return socket;
}

export function useRealtimeBooking(bookingId: string | undefined, onStatusUpdated: (status: string) => void): void {
  useEffect(() => {
    if (!bookingId) return;

    const client = getSocket();
    client.auth = { token: localStorage.getItem('accessToken') || '' };

    if (!client.connected) {
      client.connect();
    }

    client.emit('booking:join', bookingId);

    const handler = (payload: { bookingId: string; status: string }) => {
      if (payload.bookingId !== bookingId) return;
      onStatusUpdated(payload.status);
    };

    client.on('booking:status_updated', handler);

    return () => {
      client.off('booking:status_updated', handler);
      client.emit('booking:leave', bookingId);
    };
  }, [bookingId, onStatusUpdated]);
}
