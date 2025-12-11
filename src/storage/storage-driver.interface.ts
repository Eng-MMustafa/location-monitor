/**
 * location-monitor - Storage Driver Interface
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Defines the unified interface for all storage adapters
 */

import { LocationData, AgentStatus, MonitorEvent, AgentStateSnapshot } from '../events/event-types';

export interface StorageDriver {
  /**
   * Initialize the storage driver
   */
  initialize(): Promise<void>;

  /**
   * Disconnect and cleanup resources
   */
  disconnect(): Promise<void>;

  /**
   * Save agent location data
   */
  saveLocation(agentId: string, location: LocationData): Promise<void>;

  /**
   * Get the last known location for an agent
   */
  getLastLocation(agentId: string): Promise<LocationData | null>;

  /**
   * Save agent status
   */
  saveStatus(agentId: string, status: AgentStatus, timestamp: number): Promise<void>;

  /**
   * Get current agent status
   */
  getStatus(agentId: string): Promise<AgentStatus | null>;

  /**
   * Save complete agent state snapshot
   */
  saveAgentState(agentId: string, state: AgentStateSnapshot): Promise<void>;

  /**
   * Get complete agent state snapshot
   */
  getAgentState(agentId: string): Promise<AgentStateSnapshot | null>;

  /**
   * Get all active agents
   */
  getAllAgents(): Promise<string[]>;

  /**
   * Publish an event to subscribers
   */
  publishEvent(event: MonitorEvent): Promise<void>;

  /**
   * Subscribe to events
   */
  subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void>;

  /**
   * Unsubscribe from events
   */
  unsubscribeEvents(): Promise<void>;

  /**
   * Get agent statistics
   */
  getAgentStats(agentId: string): Promise<{
    totalLocations: number;
    totalDistance: number;
    lastUpdate: number;
  } | null>;

  /**
   * Clear all data for an agent
   */
  clearAgentData(agentId: string): Promise<void>;
}
