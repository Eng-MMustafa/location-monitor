/**
 * location-monitor - WebSocket Adapter
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * WebSocket-based adapter for real-time browser/client connections
 */

import { WebSocket, WebSocketServer } from 'ws';
import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from '../events/event-types';
import { getLogger } from '../utils/logger';
import { StorageDriver } from './storage-driver.interface';

export interface WebSocketAdapterConfig {
  port?: number;
  path?: string;
  host?: string;
}

export class WebSocketAdapter implements StorageDriver {
  private wss!: WebSocketServer;
  private logger = getLogger();
  private clients: Set<WebSocket> = new Set();
  
  // In-memory cache for data storage
  private cache = {
    locations: new Map<string, LocationData>(),
    statuses: new Map<string, { status: AgentStatus; timestamp: number }>(),
    states: new Map<string, AgentStateSnapshot>(),
    stats: new Map<string, { totalLocations: number; totalDistance: number; lastUpdate: number }>(),
  };

  constructor(private config: WebSocketAdapterConfig = {}) {}

  async initialize(): Promise<void> {
    this.wss = new WebSocketServer({
      port: this.config.port || 8080,
      path: this.config.path || '/location-monitor',
      host: this.config.host,
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      this.logger.info('WebSocket client connected', { totalClients: this.clients.size });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.logger.info('WebSocket client disconnected', { totalClients: this.clients.size });
      });

      ws.on('error', (error) => {
        this.logger.error('WebSocket client error', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to location-monitor',
        timestamp: Date.now(),
      }));
    });

    this.logger.info('WebSocket adapter initialized', {
      port: this.config.port || 8080,
      path: this.config.path || '/location-monitor',
    });
  }

  async disconnect(): Promise<void> {
    // Close all client connections
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();

    // Close server
    await new Promise<void>((resolve) => {
      this.wss?.close(() => {
        this.logger.info('WebSocket adapter disconnected');
        resolve();
      });
    });
  }

  async saveLocation(agentId: string, location: LocationData): Promise<void> {
    this.cache.locations.set(agentId, location);
    
    // Update stats
    const stats = this.cache.stats.get(agentId) || {
      totalLocations: 0,
      totalDistance: 0,
      lastUpdate: location.timestamp,
    };
    stats.totalLocations++;
    stats.lastUpdate = location.timestamp;
    this.cache.stats.set(agentId, stats);
  }

  async getLastLocation(agentId: string): Promise<LocationData | null> {
    return this.cache.locations.get(agentId) || null;
  }

  async saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void> {
    this.cache.statuses.set(agentId, { status, timestamp });
  }

  async getStatus(agentId: string): Promise<AgentStatus | null> {
    const data = this.cache.statuses.get(agentId);
    return data?.status || null;
  }

  async saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void> {
    this.cache.states.set(agentId, state);
  }

  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    return this.cache.states.get(agentId) || null;
  }

  async getAllAgents(): Promise<string[]> {
    const agents = new Set<string>();
    this.cache.locations.forEach((_, agentId) => agents.add(agentId));
    this.cache.statuses.forEach((_, agentId) => agents.add(agentId));
    this.cache.states.forEach((_, agentId) => agents.add(agentId));
    return Array.from(agents);
  }

  async publishEvent(event: MonitorEvent): Promise<void> {
    const message = JSON.stringify(event);
    
    // Broadcast to all connected clients
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    this.logger.debug('Event broadcast to WebSocket clients', {
      eventType: event.type,
      clientCount: this.clients.size,
    });
  }

  async subscribeEvents(_handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    // For WebSocket adapter, we handle subscriptions differently
    // Events are automatically broadcast to all connected clients
    // This method can be used for server-side event handling
    this.logger.info('WebSocket event subscription registered');
  }

  async unsubscribeEvents(): Promise<void> {
    this.logger.info('WebSocket event subscription removed');
  }

  async getAgentStats(agentId: string): Promise<{
    totalLocations: number;
    totalDistance: number;
    lastUpdate: number;
  } | null> {
    return this.cache.stats.get(agentId) || null;
  }

  async clearAgentData(agentId: string): Promise<void> {
    this.cache.locations.delete(agentId);
    this.cache.statuses.delete(agentId);
    this.cache.states.delete(agentId);
    this.cache.stats.delete(agentId);
    this.logger.info('Agent data cleared', { agentId });
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast a custom message to all clients
   */
  broadcast(message: any): void {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
