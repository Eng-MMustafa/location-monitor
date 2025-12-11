/**
 * location-monitor - Memory Storage Adapter
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * In-memory storage adapter for development and testing
 */

import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from '../events/event-types';
import { getLogger } from '../utils/logger';
import { StorageDriver } from './storage-driver.interface';

export class MemoryAdapter implements StorageDriver {
  private locations: Map<string, LocationData> = new Map();
  private statuses: Map<string, { status: AgentStatus; timestamp: number }> = new Map();
  private states: Map<string, AgentStateSnapshot> = new Map();
  private stats: Map<string, { totalLocations: number; totalDistance: number; lastUpdate: number }> = new Map();
  private eventHandlers: Array<(event: MonitorEvent) => void | Promise<void>> = [];
  private logger = getLogger();

  async initialize(): Promise<void> {
    this.logger.info('Memory adapter initialized');
  }

  async disconnect(): Promise<void> {
    this.locations.clear();
    this.statuses.clear();
    this.states.clear();
    this.stats.clear();
    this.eventHandlers = [];
    this.logger.info('Memory adapter disconnected');
  }

  async saveLocation(agentId: string, location: LocationData): Promise<void> {
    this.locations.set(agentId, location);
    
    // Update stats
    const stats = this.stats.get(agentId) || {
      totalLocations: 0,
      totalDistance: 0,
      lastUpdate: location.timestamp,
    };
    
    stats.totalLocations++;
    stats.lastUpdate = location.timestamp;
    this.stats.set(agentId, stats);
  }

  async getLastLocation(agentId: string): Promise<LocationData | null> {
    return this.locations.get(agentId) || null;
  }

  async saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void> {
    this.statuses.set(agentId, { status, timestamp });
  }

  async getStatus(agentId: string): Promise<AgentStatus | null> {
    const data = this.statuses.get(agentId);
    return data?.status || null;
  }

  async saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void> {
    this.states.set(agentId, state);
  }

  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    return this.states.get(agentId) || null;
  }

  async getAllAgents(): Promise<string[]> {
    const agents = new Set<string>();
    
    this.locations.forEach((_, agentId) => agents.add(agentId));
    this.statuses.forEach((_, agentId) => agents.add(agentId));
    this.states.forEach((_, agentId) => agents.add(agentId));
    
    return Array.from(agents);
  }

  async publishEvent(event: MonitorEvent): Promise<void> {
    // Execute all event handlers
    const promises = this.eventHandlers.map((handler) => {
      try {
        return Promise.resolve(handler(event));
      } catch (error) {
        this.logger.error('Event handler error', error as Error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  async subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    this.eventHandlers.push(handler);
    this.logger.debug('Event subscriber added', { totalSubscribers: this.eventHandlers.length });
  }

  async unsubscribeEvents(): Promise<void> {
    this.eventHandlers = [];
    this.logger.debug('All event subscribers removed');
  }

  async getAgentStats(agentId: string): Promise<{
    totalLocations: number;
    totalDistance: number;
    lastUpdate: number;
  } | null> {
    return this.stats.get(agentId) || null;
  }

  async clearAgentData(agentId: string): Promise<void> {
    this.locations.delete(agentId);
    this.statuses.delete(agentId);
    this.states.delete(agentId);
    this.stats.delete(agentId);
    this.logger.info('Agent data cleared', { agentId });
  }
}
