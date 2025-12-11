/**
 * location-monitor - Location Engine
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Core engine for processing location updates
 */

import { EventType, LocationData, LocationReceivedPayload } from '../events/event-types';
import { StorageDriver } from '../storage/storage-driver.interface';
import { ThresholdConfig } from '../types/config.types';
import { calculateBearing, calculateDistance, calculateSpeed, isAbnormalJump, isValidCoordinate } from '../utils/distance-calculator';
import { getLogger } from '../utils/logger';
import { isValidTimestamp, now } from '../utils/time.utils';

export class LocationEngine {
  private logger = getLogger();

  constructor(
    private storage: StorageDriver,
    private thresholds: ThresholdConfig,
  ) {}

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
    // Validate input
    this.validateInput(agentId, latitude, longitude);

    // Auto-correct missing timestamp
    const locationTimestamp = timestamp && isValidTimestamp(timestamp) ? timestamp : now();

    // Get last known location
    const lastLocation = await this.storage.getLastLocation(agentId);

    // Calculate movement metrics
    let speed: number | undefined;
    let heading: number | undefined;
    let distanceTraveled = 0;

    if (lastLocation) {
      distanceTraveled = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        latitude,
        longitude,
      );

      const timeDiff = locationTimestamp - lastLocation.timestamp;

      // Check for abnormal jumps
      if (isAbnormalJump(distanceTraveled, timeDiff, this.thresholds.maxJumpDistance)) {
        this.logger.warn('Abnormal location jump detected', {
          agentId,
          distance: distanceTraveled,
          timeDiff,
          lastLocation: {
            lat: lastLocation.latitude,
            lon: lastLocation.longitude,
          },
          currentLocation: {
            lat: latitude,
            lon: longitude,
          },
        });
      }

      // Calculate speed (km/h)
      if (timeDiff > 0) {
        speed = calculateSpeed(distanceTraveled, timeDiff);
      }

      // Calculate heading/bearing
      if (distanceTraveled > 1) { // Only calculate if moved more than 1 meter
        heading = calculateBearing(
          lastLocation.latitude,
          lastLocation.longitude,
          latitude,
          longitude,
        );
      }
    }

    // Create location data object
    const locationData: LocationData = {
      agentId,
      latitude,
      longitude,
      timestamp: locationTimestamp,
      speed,
      heading,
      metadata,
    };

    // Save location
    await this.storage.saveLocation(agentId, locationData);

    // Emit location.received event
    await this.storage.publishEvent({
      type: EventType.LOCATION_RECEIVED,
      payload: {
        agentId,
        location: locationData,
        distanceTraveled,
        speed,
      } as LocationReceivedPayload,
      timestamp: now(),
    });

    this.logger.debug('Location tracked', {
      agentId,
      latitude,
      longitude,
      speed,
      heading,
      distanceTraveled,
    });

    return locationData;
  }

  /**
   * Get current location for an agent
   */
  async getCurrentLocation(agentId: string): Promise<LocationData | null> {
    return this.storage.getLastLocation(agentId);
  }

  /**
   * Calculate distance between two agents
   */
  async getDistanceBetweenAgents(agentId1: string, agentId2: string): Promise<number | null> {
    const [location1, location2] = await Promise.all([
      this.storage.getLastLocation(agentId1),
      this.storage.getLastLocation(agentId2),
    ]);

    if (!location1 || !location2) {
      return null;
    }

    return calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude,
    );
  }

  /**
   * Validate location input
   */
  private validateInput(agentId: string, latitude: number, longitude: number): void {
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Invalid agentId: must be a non-empty string');
    }

    if (!isValidCoordinate(latitude, longitude)) {
      throw new Error(
        `Invalid coordinates: latitude=${latitude}, longitude=${longitude}`,
      );
    }
  }
}
