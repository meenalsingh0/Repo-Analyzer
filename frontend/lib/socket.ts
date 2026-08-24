import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function subscribeToJob(
  jobId: string,
  onProgress: (data: { jobId: string; progress: number; message: string }) => void,
) {
  const s = getSocket();
  s.emit('subscribe', { jobId });
  s.on('progress', onProgress);
  return () => {
    s.off('progress', onProgress);
    s.emit('unsubscribe', { jobId });
  };
}
