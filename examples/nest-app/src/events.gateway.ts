/**
 * location-monitor - NestJS Example - WebSocket Gateway
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { LocationMonitorService, MonitorEvent } from 'location-monitor';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  constructor(private readonly monitor: LocationMonitorService) {}

  async afterInit(): Promise<void> {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to location monitor events
    await this.monitor.subscribeEvents((event: MonitorEvent) => {
      // Broadcast all events to connected clients
      this.server.emit('location-event', event);
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
