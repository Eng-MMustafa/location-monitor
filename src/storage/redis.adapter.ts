/**
 * location-monitor - Redis Storage Adapter
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Redis-based storage adapter with pub/sub support
 */

import { createClient, RedisClientType } from 'redis';
import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from '../events/event-types';
import { getLogger } from '../utils/logger';
import { StorageDriver } from './storage-driver.interface';

export interface RedisAdapterConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  url?: string;
}

export class RedisAdapter implements StorageDriver {
  private client!: RedisClientType;
  private pubClient!: RedisClientType;
  private subClient!: RedisClientType;
  private logger = getLogger();
  private keyPrefix: string;
  private eventChannel = 'location-monitor:events';

  constructor(private config: RedisAdapterConfig = {}) {
    this.keyPrefix = config.keyPrefix || 'location-monitor:';
  }

  async initialize(): Promise<void> {
    const clientConfig = this.config.url
      ? { url: this.config.url }
      : {
          socket: {
            host: this.config.host || 'localhost',
            port: this.config.port || 6379,
          },
          password: this.config.password,
          database: this.config.db || 0,
        };

    this.client = createClient(clientConfig as any);
    this.pubClient = createClient(clientConfig as any);
    this.subClient = createClient(clientConfig as any);

    await Promise.all([
      this.client.connect(),
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);

    this.logger.info('Redis adapter initialized', {
      host: this.config.host || 'localhost',
      port: this.config.port || 6379,
    });
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client?.quit(),
      this.pubClient?.quit(),
      this.subClient?.quit(),
    ]);
    this.logger.info('Redis adapter disconnected');
  }

  async saveLocation(agentId: string, location: LocationData): Promise<void> {
    const key = this.getKey('location', agentId);
    await this.client.set(key, JSON.stringify(location));
    
    // Update stats
    await this.incrementStats(agentId, 'totalLocations');
    await this.client.set(this.getKey('stats', agentId, 'lastUpdate'), location.timestamp.toString());
  }

  async getLastLocation(agentId: string): Promise<LocationData | null> {
    const key = this.getKey('location', agentId);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void> {
    const key = this.getKey('status', agentId);
    await this.client.hSet(key, {
      status,
      timestamp: timestamp.toString(),
    });
  }

  async getStatus(agentId: string): Promise<AgentStatus | null> {
    const key = this.getKey('status', agentId);
    const status = await this.client.hGet(key, 'status');
    return status as AgentStatus | null;
  }

  async saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void> {
    const key = this.getKey('state', agentId);
    await this.client.set(key, JSON.stringify(state));
  }

  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    const key = this.getKey('state', agentId);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getAllAgents(): Promise<string[]> {
    const pattern = this.getKey('location', '*');
    const keys = await this.client.keys(pattern);
    return keys.map((key) => key.replace(this.getKey('location', ''), ''));
  }

  async publishEvent(event: MonitorEvent): Promise<void> {
    await this.pubClient.publish(this.eventChannel, JSON.stringify(event));
  }

  async subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    await this.subClient.subscribe(this.eventChannel, async (message) => {
      try {
        const event = JSON.parse(message) as MonitorEvent;
        await handler(event);
      } catch (error) {
        this.logger.error('Error processing event', error as Error);
      }
    });
    
    this.logger.info('Subscribed to Redis events', { channel: this.eventChannel });
  }

  async unsubscribeEvents(): Promise<void> {
    await this.subClient.unsubscribe(this.eventChannel);
    this.logger.info('Unsubscribed from Redis events');
  }

  async getAgentStats(agentId: string): Promise<{
    totalLocations: number;
    totalDistance: number;
    lastUpdate: number;
  } | null> {
    const totalLocations = await this.client.get(this.getKey('stats', agentId, 'totalLocations'));
    const totalDistance = await this.client.get(this.getKey('stats', agentId, 'totalDistance'));
    const lastUpdate = await this.client.get(this.getKey('stats', agentId, 'lastUpdate'));

    if (!totalLocations && !lastUpdate) {
      return null;
    }

    return {
      totalLocations: parseInt(totalLocations || '0', 10),
      totalDistance: parseFloat(totalDistance || '0'),
      lastUpdate: parseInt(lastUpdate || '0', 10),
    };
  }

  async clearAgentData(agentId: string): Promise<void> {
    const keys = [
      this.getKey('location', agentId),
      this.getKey('status', agentId),
      this.getKey('state', agentId),
      this.getKey('stats', agentId, '*'),
    ];

    const allKeys = await Promise.all(
      keys.map((pattern) => this.client.keys(pattern)),
    );

    const flatKeys = allKeys.flat();
    if (flatKeys.length > 0) {
      await this.client.del(flatKeys);
    }

    this.logger.info('Agent data cleared from Redis', { agentId });
  }

  private getKey(...parts: string[]): string {
    return this.keyPrefix + parts.join(':');
  }

  private async incrementStats(agentId: string, field: string): Promise<void> {
    const key = this.getKey('stats', agentId, field);
    await this.client.incr(key);
  }
}
