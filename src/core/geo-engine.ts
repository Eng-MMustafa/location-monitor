/**
 * location-monitor - Geo Engine
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Engine for managing geofences and detecting enter/exit events
 */

import { EventType, GeofenceEvent, LocationData } from '../events/event-types';
import { StorageDriver } from '../storage/storage-driver.interface';
import { Geofence } from '../types/config.types';
import { isPointInGeofence, validateGeofence } from '../utils/geo.utils';
import { getLogger } from '../utils/logger';
import { now } from '../utils/time.utils';

export class GeoEngine {
  private geofences: Map<string, Geofence> = new Map();
  private agentGeofences: Map<string, Set<string>> = new Map(); // agentId -> Set of geofenceIds
  private logger = getLogger();

  constructor(private storage: StorageDriver) {}

  /**
   * Register a new geofence
   */
  registerGeofence(geofence: Geofence): void {
    const validation = validateGeofence(geofence);
    
    if (!validation.valid) {
      throw new Error(`Invalid geofence: ${validation.errors.join(', ')}`);
    }

    this.geofences.set(geofence.id, geofence);
    this.logger.info('Geofence registered', {
      id: geofence.id,
      name: geofence.name,
      type: geofence.type,
    });
  }

  /**
   * Remove a geofence
   */
  removeGeofence(geofenceId: string): void {
    this.geofences.delete(geofenceId);
    
    // Remove from all agents
    for (const agentGeofences of this.agentGeofences.values()) {
      agentGeofences.delete(geofenceId);
    }

    this.logger.info('Geofence removed', { geofenceId });
  }

  /**
   * Get all registered geofences
   */
  getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Get a specific geofence
   */
  getGeofence(geofenceId: string): Geofence | undefined {
    return this.geofences.get(geofenceId);
  }

  /**
   * Check location against all geofences and emit events
   */
  async checkGeofences(agentId: string, location: LocationData): Promise<void> {
    const currentGeofences = this.agentGeofences.get(agentId) || new Set<string>();
    const newGeofences = new Set<string>();

    // Check all registered geofences
    for (const [geofenceId, geofence] of this.geofences) {
      const isInside = isPointInGeofence(
        location.latitude,
        location.longitude,
        geofence,
      );

      if (isInside) {
        newGeofences.add(geofenceId);

        // Check if agent just entered this geofence
        if (!currentGeofences.has(geofenceId)) {
          await this.emitGeofenceEnterEvent(agentId, geofence, location);
        }
      } else {
        // Check if agent just exited this geofence
        if (currentGeofences.has(geofenceId)) {
          await this.emitGeofenceExitEvent(agentId, geofence, location);
        }
      }
    }

    // Update agent's active geofences
    this.agentGeofences.set(agentId, newGeofences);
  }

  /**
   * Get active geofences for an agent
   */
  getAgentGeofences(agentId: string): Geofence[] {
    const geofenceIds = this.agentGeofences.get(agentId) || new Set<string>();
    return Array.from(geofenceIds)
      .map((id) => this.geofences.get(id))
      .filter((g): g is Geofence => g !== undefined);
  }

  /**
   * Check if agent is in a specific geofence
   */
  isAgentInGeofence(agentId: string, geofenceId: string): boolean {
    const geofenceIds = this.agentGeofences.get(agentId);
    return geofenceIds?.has(geofenceId) || false;
  }

  /**
   * Get all agents in a specific geofence
   */
  getAgentsInGeofence(geofenceId: string): string[] {
    const agents: string[] = [];

    for (const [agentId, geofenceIds] of this.agentGeofences) {
      if (geofenceIds.has(geofenceId)) {
        agents.push(agentId);
      }
    }

    return agents;
  }

  /**
   * Clear agent geofence data
   */
  clearAgentGeofences(agentId: string): void {
    this.agentGeofences.delete(agentId);
  }

  /**
   * Emit geofence enter event
   */
  private async emitGeofenceEnterEvent(
    agentId: string,
    geofence: Geofence,
    location: LocationData,
  ): Promise<void> {
    const event: GeofenceEvent = {
      agentId,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      location,
      timestamp: now(),
      eventType: 'enter',
    };

    await this.storage.publishEvent({
      type: EventType.AGENT_ENTERED_GEOFENCE,
      payload: event,
      timestamp: now(),
    });

    this.logger.info('Agent entered geofence', {
      agentId,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
    });
  }

  /**
   * Emit geofence exit event
   */
  private async emitGeofenceExitEvent(
    agentId: string,
    geofence: Geofence,
    location: LocationData,
  ): Promise<void> {
    const event: GeofenceEvent = {
      agentId,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      location,
      timestamp: now(),
      eventType: 'exit',
    };

    await this.storage.publishEvent({
      type: EventType.AGENT_EXITED_GEOFENCE,
      payload: event,
      timestamp: now(),
    });

    this.logger.info('Agent exited geofence', {
      agentId,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
    });
  }
}
