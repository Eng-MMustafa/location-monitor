/**
 * location-monitor - Kafka Storage Adapter
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Kafka-based storage adapter for high-throughput event streaming
 */

import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from '../events/event-types';
import { getLogger } from '../utils/logger';
import { StorageDriver } from './storage-driver.interface';

export interface KafkaAdapterConfig {
  brokers: string[];
  clientId?: string;
  groupId?: string;
  topic?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

export class KafkaAdapter implements StorageDriver {
  private kafka!: Kafka;
  private producer!: Producer;
  private consumer!: Consumer;
  private logger = getLogger();
  private topic: string;
  
  // In-memory cache for quick lookups (Kafka is event-streaming, not a database)
  private cache = {
    locations: new Map<string, LocationData>(),
    statuses: new Map<string, { status: AgentStatus; timestamp: number }>(),
    states: new Map<string, AgentStateSnapshot>(),
    stats: new Map<string, { totalLocations: number; totalDistance: number; lastUpdate: number }>(),
  };

  constructor(private config: KafkaAdapterConfig) {
    this.topic = config.topic || 'location-monitor-events';
  }

  async initialize(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.clientId || 'location-monitor',
      brokers: this.config.brokers,
      ssl: this.config.ssl,
      sasl: this.config.sasl as any,
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.config.groupId || 'location-monitor-group',
    });

    await this.producer.connect();
    await this.consumer.connect();

    this.logger.info('Kafka adapter initialized', {
      brokers: this.config.brokers,
      topic: this.topic,
    });
  }

  async disconnect(): Promise<void> {
    await this.producer?.disconnect();
    await this.consumer?.disconnect();
    this.logger.info('Kafka adapter disconnected');
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

    // Optionally send to Kafka for persistence
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: agentId,
          value: JSON.stringify({ type: 'location', agentId, data: location }),
        },
      ],
    });
  }

  async getLastLocation(agentId: string): Promise<LocationData | null> {
    return this.cache.locations.get(agentId) || null;
  }

  async saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void> {
    this.cache.statuses.set(agentId, { status, timestamp });

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: agentId,
          value: JSON.stringify({ type: 'status', agentId, status, timestamp }),
        },
      ],
    });
  }

  async getStatus(agentId: string): Promise<AgentStatus | null> {
    const data = this.cache.statuses.get(agentId);
    return data?.status || null;
  }

  async saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void> {
    this.cache.states.set(agentId, state);

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: agentId,
          value: JSON.stringify({ type: 'state', agentId, data: state }),
        },
      ],
    });
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
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: event.type,
          value: JSON.stringify(event),
          headers: {
            eventType: event.type,
            timestamp: event.timestamp.toString(),
          },
        },
      ],
    });
  }

  async subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (message.value) {
            const data = JSON.parse(message.value.toString());
            
            // Only process actual events, not data updates
            if (data.type && data.payload && data.timestamp) {
              await handler(data as MonitorEvent);
            }
          }
        } catch (error) {
          this.logger.error('Error processing Kafka message', error as Error);
        }
      },
    });

    this.logger.info('Subscribed to Kafka events', { topic: this.topic });
  }

  async unsubscribeEvents(): Promise<void> {
    await this.consumer.stop();
    this.logger.info('Unsubscribed from Kafka events');
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
