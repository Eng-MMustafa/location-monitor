/**
 * location-monitor - Status Engine
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Engine for detecting and managing agent status changes
 */

import { AgentStatus, EventType, LocationData, StatusChangePayload } from '../events/event-types';
import { StorageDriver } from '../storage/storage-driver.interface';
import { ThresholdConfig } from '../types/config.types';
import { getLogger } from '../utils/logger';
import { isOlderThan, now } from '../utils/time.utils';

export class StatusEngine {
  private logger = getLogger();

  constructor(
    private storage: StorageDriver,
    private thresholds: ThresholdConfig,
  ) {}

  /**
   * Detect and update agent status based on latest location data
   */
  async detectStatus(agentId: string, location: LocationData): Promise<AgentStatus> {
    const currentStatus = await this.storage.getStatus(agentId);
    const lastLocation = await this.storage.getLastLocation(agentId);

    let newStatus = this.determineStatus(location, lastLocation);

    if (currentStatus !== newStatus) {
      await this.updateStatus(agentId, currentStatus || AgentStatus.ACTIVE, newStatus, location.timestamp);
    }

    return newStatus;
  }

  /**
   * Check status based on last update time (called by watchdog)
   */
  async checkStatusByTime(agentId: string): Promise<AgentStatus> {
    const state = await this.storage.getAgentState(agentId);
    
    if (!state || !state.lastUpdate) {
      return AgentStatus.OFFLINE;
    }

    const currentStatus = state.status;
    let newStatus = currentStatus;

    // Check if agent is unreachable
    if (isOlderThan(state.lastUpdate, this.thresholds.unreachableAfter)) {
      if (currentStatus !== AgentStatus.UNREACHABLE && currentStatus !== AgentStatus.OFFLINE) {
        newStatus = AgentStatus.UNREACHABLE;
        this.logger.warn('Agent unreachable', { agentId, lastUpdate: state.lastUpdate });
      }
    }

    // Check if agent is offline
    if (isOlderThan(state.lastUpdate, this.thresholds.offlineAfter)) {
      if (currentStatus !== AgentStatus.OFFLINE) {
        newStatus = AgentStatus.OFFLINE;
        this.logger.warn('Agent offline', { agentId, lastUpdate: state.lastUpdate });
      }
    }

    // Check if agent is idle (no movement)
    if (state.lastMovement && isOlderThan(state.lastMovement, this.thresholds.idleAfter)) {
      if (currentStatus === AgentStatus.ACTIVE || currentStatus === AgentStatus.MOVING) {
        newStatus = AgentStatus.IDLE;
        this.logger.info('Agent idle', { agentId, lastMovement: state.lastMovement });
      }
    }

    if (currentStatus !== newStatus) {
      await this.updateStatus(agentId, currentStatus, newStatus, now());
    }

    return newStatus;
  }

  /**
   * Manually set agent status
   */
  async setStatus(agentId: string, status: AgentStatus, reason?: string): Promise<void> {
    const currentStatus = await this.storage.getStatus(agentId);
    
    if (currentStatus !== status) {
      await this.updateStatus(agentId, currentStatus || AgentStatus.OFFLINE, status, now(), reason);
    }
  }

  /**
   * Get current agent status
   */
  async getStatus(agentId: string): Promise<AgentStatus | null> {
    return this.storage.getStatus(agentId);
  }

  /**
   * Determine status based on location data
   */
  private determineStatus(currentLocation: LocationData, lastLocation: LocationData | null): AgentStatus {
    // If this is the first location, agent is active
    if (!lastLocation) {
      return AgentStatus.ACTIVE;
    }

    // Check if agent came back online
    const timeDiff = currentLocation.timestamp - lastLocation.timestamp;
    if (timeDiff > this.thresholds.unreachableAfter) {
      return AgentStatus.ACTIVE; // Back online
    }

    // Determine if moving or stopped based on speed
    const speed = currentLocation.speed || 0;
    
    if (speed >= this.thresholds.minSpeed) {
      return AgentStatus.MOVING;
    } else {
      return AgentStatus.STOPPED;
    }
  }

  /**
   * Update agent status and emit event
   */
  private async updateStatus(
    agentId: string,
    oldStatus: AgentStatus,
    newStatus: AgentStatus,
    timestamp: number,
    reason?: string,
  ): Promise<void> {
    // Save new status
    await this.storage.saveStatus(agentId, newStatus, timestamp);

    // Emit status.changed event
    await this.storage.publishEvent({
      type: EventType.STATUS_CHANGED,
      payload: {
        agentId,
        oldStatus,
        newStatus,
        timestamp,
        reason,
      } as StatusChangePayload,
      timestamp: now(),
    });

    // Emit specific status events
    await this.emitSpecificStatusEvents(agentId, oldStatus, newStatus, timestamp);

    this.logger.info('Status changed', {
      agentId,
      oldStatus,
      newStatus,
      reason,
    });
  }

  /**
   * Emit specific status events based on transitions
   */
  private async emitSpecificStatusEvents(
    agentId: string,
    oldStatus: AgentStatus,
    newStatus: AgentStatus,
    timestamp: number,
  ): Promise<void> {
    const state = await this.storage.getAgentState(agentId);

    // Agent unreachable
    if (newStatus === AgentStatus.UNREACHABLE && oldStatus !== AgentStatus.UNREACHABLE) {
      await this.storage.publishEvent({
        type: EventType.AGENT_UNREACHABLE,
        payload: state || { agentId, status: newStatus, lastUpdate: timestamp, totalDistanceTraveled: 0, activeGeofences: [] },
        timestamp: now(),
      });
    }

    // Agent back online
    if (
      (oldStatus === AgentStatus.UNREACHABLE || oldStatus === AgentStatus.OFFLINE) &&
      (newStatus === AgentStatus.ACTIVE || newStatus === AgentStatus.MOVING)
    ) {
      await this.storage.publishEvent({
        type: EventType.AGENT_BACK_ONLINE,
        payload: state || { agentId, status: newStatus, lastUpdate: timestamp, totalDistanceTraveled: 0, activeGeofences: [] },
        timestamp: now(),
      });
    }

    // Agent idle
    if (newStatus === AgentStatus.IDLE && oldStatus !== AgentStatus.IDLE) {
      await this.storage.publishEvent({
        type: EventType.AGENT_IDLE,
        payload: state || { agentId, status: newStatus, lastUpdate: timestamp, totalDistanceTraveled: 0, activeGeofences: [] },
        timestamp: now(),
      });
    }

    // Agent active
    if (
      newStatus === AgentStatus.ACTIVE &&
      (oldStatus === AgentStatus.IDLE || oldStatus === AgentStatus.STOPPED)
    ) {
      await this.storage.publishEvent({
        type: EventType.AGENT_ACTIVE,
        payload: state || { agentId, status: newStatus, lastUpdate: timestamp, totalDistanceTraveled: 0, activeGeofences: [] },
        timestamp: now(),
      });
    }
  }
}
