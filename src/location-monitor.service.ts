/**
 * location-monitor - Main Service
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Main service that orchestrates all engines and provides the public API
 */

import { GeoEngine } from './core/geo-engine';
import { LocationEngine } from './core/location-engine';
import { StatusEngine } from './core/status-engine';
import { WatchdogEngine } from './core/watchdog-engine';
import { AgentStateSnapshot, AgentStatus, LocationData, MonitorEvent } from './events/event-types';
import { StorageDriver } from './storage/storage-driver.interface';
import { DEFAULT_CONFIG, Geofence, LocationMonitorConfig } from './types/config.types';
import { Logger, setLogger } from './utils/logger';
import { now } from './utils/time.utils';

export class LocationMonitorService {
  private locationEngine: LocationEngine;
  private statusEngine: StatusEngine;
  private watchdogEngine: WatchdogEngine;
  private geoEngine: GeoEngine;
  private storage: StorageDriver;
  private config: LocationMonitorConfig;
  private logger: Logger;
  private initialized = false;

  constructor(config: Partial<LocationMonitorConfig> & { storageDriver: StorageDriver }) {
    // Merge with default config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
      watchdog: { ...DEFAULT_CONFIG.watchdog, ...config.watchdog },
      geofence: { ...DEFAULT_CONFIG.geofence, ...config.geofence },
      logging: { ...DEFAULT_CONFIG.logging, ...config.logging },
    } as LocationMonitorConfig;

    // Initialize logger
    this.logger = new Logger(this.config.logging);
    setLogger(this.logger);

    // Set storage driver
    this.storage = config.storageDriver;

    // Initialize engines
    this.locationEngine = new LocationEngine(this.storage, this.config.thresholds);
    this.statusEngine = new StatusEngine(this.storage, this.config.thresholds);
    this.watchdogEngine = new WatchdogEngine(this.storage, this.statusEngine, this.config.watchdog);
    this.geoEngine = new GeoEngine(this.storage);
  }

  /**
   * Initialize the location monitor service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Location monitor already initialized');
      return;
    }

    // Initialize storage
    await this.storage.initialize();

    // Start watchdog if enabled
    if (this.config.watchdog.enabled) {
      this.watchdogEngine.start();
    }

    this.initialized = true;
    this.logger.info('Location monitor service initialized');
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down location monitor service');

    // Stop watchdog
    this.watchdogEngine.stop();

    // Disconnect storage
    await this.storage.disconnect();

    // Close logger
    this.logger.close();

    this.initialized = false;
    this.logger.info('Location monitor service shut down');
  }

  /**
   * Track location for an agent
   */
  async trackLocation(
    agentId: string,
    latitude: number,
    longitude: number,
    timestamp?: number,
    metadata?: Record<string, any>,
  ): Promise<LocationData> {
    this.ensureInitialized();

    // Process location through location engine
    const location = await this.locationEngine.trackLocation(
      agentId,
      latitude,
      longitude,
      timestamp,
      metadata,
    );

    // Detect status
    const status = await this.statusEngine.detectStatus(agentId, location);

    // Check geofences if enabled
    if (this.config.geofence.enabled) {
      await this.geoEngine.checkGeofences(agentId, location);
    }

    // Update agent state
    await this.updateAgentState(agentId, location, status);

    return location;
  }

  /**
   * Get current location for an agent
   */
  async getLocation(agentId: string): Promise<LocationData | null> {
    this.ensureInitialized();
    return this.locationEngine.getCurrentLocation(agentId);
  }

  /**
   * Get current status for an agent
   */
  async getStatus(agentId: string): Promise<AgentStatus | null> {
    this.ensureInitialized();
    return this.statusEngine.getStatus(agentId);
  }

  /**
   * Get complete agent state
   */
  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    this.ensureInitialized();
    return this.storage.getAgentState(agentId);
  }

  /**
   * Get all active agents
   */
  async getAllAgents(): Promise<string[]> {
    this.ensureInitialized();
    return this.storage.getAllAgents();
  }

  /**
   * Manually set agent status
   */
  async setStatus(agentId: string, status: AgentStatus, reason?: string): Promise<void> {
    this.ensureInitialized();
    await this.statusEngine.setStatus(agentId, status, reason);
  }

  /**
   * Register a geofence
   */
  registerGeofence(geofence: Geofence): void {
    this.ensureInitialized();
    this.geoEngine.registerGeofence(geofence);
  }

  /**
   * Remove a geofence
   */
  removeGeofence(geofenceId: string): void {
    this.ensureInitialized();
    this.geoEngine.removeGeofence(geofenceId);
  }

  /**
   * Get all geofences
   */
  getGeofences(): Geofence[] {
    this.ensureInitialized();
    return this.geoEngine.getGeofences();
  }

  /**
   * Get active geofences for an agent
   */
  getAgentGeofences(agentId: string): Geofence[] {
    this.ensureInitialized();
    return this.geoEngine.getAgentGeofences(agentId);
  }

  /**
   * Subscribe to events
   */
  async subscribeEvents(handler: (event: MonitorEvent) => void | Promise<void>): Promise<void> {
    this.ensureInitialized();
    await this.storage.subscribeEvents(handler);
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribeEvents(): Promise<void> {
    this.ensureInitialized();
    await this.storage.unsubscribeEvents();
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(agentId: string): Promise<{
    totalLocations: number;
    totalDistance: number;
    lastUpdate: number;
  } | null> {
    this.ensureInitialized();
    return this.storage.getAgentStats(agentId);
  }

  /**
   * Clear all data for an agent
   */
  async clearAgentData(agentId: string): Promise<void> {
    this.ensureInitialized();
    await this.storage.clearAgentData(agentId);
    this.geoEngine.clearAgentGeofences(agentId);
  }

  /**
   * Calculate distance between two agents
   */
  async getDistanceBetweenAgents(agentId1: string, agentId2: string): Promise<number | null> {
    this.ensureInitialized();
    return this.locationEngine.getDistanceBetweenAgents(agentId1, agentId2);
  }

  /**
   * Force watchdog check for a specific agent
   */
  async forceWatchdogCheck(agentId: string): Promise<void> {
    this.ensureInitialized();
    await this.watchdogEngine.forceCheck(agentId);
  }

  /**
   * Force watchdog check for all agents
   */
  async forceWatchdogCheckAll(): Promise<void> {
    this.ensureInitialized();
    await this.watchdogEngine.forceCheckAll();
  }

  /**
   * Update agent state snapshot
   */
  private async updateAgentState(
    agentId: string,
    location: LocationData,
    status: AgentStatus,
  ): Promise<void> {
    const currentState = await this.storage.getAgentState(agentId);
    const activeGeofences = this.geoEngine.getAgentGeofences(agentId).map((g) => g.id);

    const newState: AgentStateSnapshot = {
      agentId,
      status,
      lastLocation: location,
      lastUpdate: now(),
      lastMovement: location.speed && location.speed > 0 ? now() : currentState?.lastMovement,
      totalDistanceTraveled: currentState?.totalDistanceTraveled || 0,
      activeGeofences,
    };

    await this.storage.saveAgentState(agentId, newState);
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Location monitor service not initialized. Call initialize() first.');
    }
  }
}
