/**
 * location-monitor - RabbitMQ Storage Adapter
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * RabbitMQ-based storage adapter for reliable message queuing
 */

import * as amqp from 'amqplib';
import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from '../events/event-types';
import { getLogger } from '../utils/logger';
import { StorageDriver } from './storage-driver.interface';

export interface RabbitMQAdapterConfig {
  url: string;
  exchange?: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  queue?: string;
  durable?: boolean;
}

export class RabbitMQAdapter implements StorageDriver {
  private connection: any;
  private channel!: amqp.Channel;
  private logger = getLogger();
  private exchange: string;
  private exchangeType: string;
  private queue: string;
  
  // In-memory cache for quick lookups
  private cache = {
    locations: new Map<string, LocationData>(),
    statuses: new Map<string, { status: AgentStatus; timestamp: number }>(),
    states: new Map<string, AgentStateSnapshot>(),
    stats: new Map<string, { totalLocations: number; totalDistance: number; lastUpdate: number }>(),
  };

  constructor(private config: RabbitMQAdapterConfig) {
    this.exchange = config.exchange || 'location-monitor';
    this.exchangeType = config.exchangeType || 'topic';
    this.queue = config.queue || 'location-monitor-events';
  }

  async initialize(): Promise<void> {
    const conn = await amqp.connect(this.config.url);
    this.connection = conn;
    this.channel = await conn.createChannel();

    // Declare exchange
    await this.channel.assertExchange(this.exchange, this.exchangeType, {
      durable: this.config.durable !== false,
    });

    // Declare queue
    await this.channel.assertQueue(this.queue, {
      durable: this.config.durable !== false,
    });

    this.logger.info('RabbitMQ adapter initialized', {
      exchange: this.exchange,
      queue: this.queue,
    });
  }

  async disconnect(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.logger.info('RabbitMQ adapter disconnected');
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

    // Publish to RabbitMQ
    const message = JSON.stringify({ type: 'location', agentId, data: location });
    this.channel.publish(
      this.exchange,
      `location.${agentId}`,
      Buffer.from(message),
      { persistent: true },
    );
  }

  async getLastLocation(agentId: string): Promise<LocationData | null> {
    return this.cache.locations.get(agentId) || null;
  }

  async saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void> {
    this.cache.statuses.set(agentId, { status, timestamp });

    const message = JSON.stringify({ type: 'status', agentId, status, timestamp });
    this.channel.publish(
      this.exchange,
      `status.${agentId}`,
      Buffer.from(message),
      { persistent: true },
    );
  }

  async getStatus(agentId: string): Promise<AgentStatus | null> {
    const data = this.cache.statuses.get(agentId);
    return data?.status || null;
  }

  async saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void> {
    this.cache.states.set(agentId, state);

    const message = JSON.stringify({ type: 'state', agentId, data: state });
    this.channel.publish(
      this.exchange,
      `state.${agentId}`,
      Buffer.from(message),
      { persistent: true },
    );
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
    this.channel.publish(
      this.exchange,
      `event.${event.type}`,
      Buffer.from(message),
      { persistent: true },
    );
  }

  async subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    // Bind queue to exchange for all event types
    await this.channel.bindQueue(this.queue, this.exchange, 'event.#');

    // Consume messages
    await this.channel.consume(
      this.queue,
      async (msg) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            
            // Only process actual events
            if (data.type && data.payload && data.timestamp) {
              await handler(data as MonitorEvent);
            }
            
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing RabbitMQ message', error as Error);
            this.channel.nack(msg, false, false); // Don't requeue
          }
        }
      },
      { noAck: false },
    );

    this.logger.info('Subscribed to RabbitMQ events', { queue: this.queue });
  }

  async unsubscribeEvents(): Promise<void> {
    await this.channel.cancel(this.queue);
    this.logger.info('Unsubscribed from RabbitMQ events');
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
    this.logger.info('Agent data cleared from cache', { agentId });
  }
}
