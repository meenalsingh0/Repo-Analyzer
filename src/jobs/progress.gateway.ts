import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const room = (jobId: string) => `job:${jobId}`;

@WebSocketGateway({ cors: { origin: '*' } })
export class ProgressGateway {
  @WebSocketServer()
  server: Server;

  // Client asks to watch a job → join its room
  @SubscribeMessage('subscribe')
  subscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
    client.join(room(data.jobId));
    return { subscribed: data.jobId };
  }

  @SubscribeMessage('unsubscribe')
  unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
    client.leave(room(data.jobId));
    return { unsubscribed: data.jobId };
  }

  // Called by the worker at each stage — only reaches sockets in this job's room
  emitProgress(jobId: string, stage: string, progress: number) {
    this.server.to(room(jobId)).emit('job:progress', { jobId, stage, progress });
  }

  emitCompleted(jobId: string, result: unknown) {
    this.server.to(room(jobId)).emit('job:completed', { jobId, result });
  }

  emitFailed(jobId: string, error: string) {
    this.server.to(room(jobId)).emit('job:failed', { jobId, error });
  }
}
