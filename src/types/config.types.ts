/**
 * location-monitor - Configuration Types
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Defines all configuration interfaces and types
 */

import { StorageDriver } from '../storage/storage-driver.interface';
import { LogLevel } from '../utils/logger';

export interface ThresholdConfig {
  /** Time in ms after which an agent is considered IDLE (default: 300000 = 5 minutes) */
  idleAfter: number;
  
  /** Time in ms after which an agent is considered UNREACHABLE (default: 30000 = 30 seconds) */
  unreachableAfter: number;
  
  /** Time in ms after which an agent is considered OFFLINE (default: 600000 = 10 minutes) */
  offlineAfter: number;
  
  /** Minimum speed in km/h to be considered MOVING (default: 1.5) */
  minSpeed: number;
  
  /** Maximum jump distance in meters to detect abnormal movements (default: 300) */
  maxJumpDistance: number;
}

export interface WatchdogConfig {
  /** Enable the watchdog background engine (default: true) */
  enabled: boolean;
  
  /** Watchdog check interval in ms (default: 5000 = 5 seconds) */
  checkInterval: number;
}

export interface GeofenceConfig {
  /** Enable geofencing features (default: true) */
  enabled: boolean;
}

export interface LoggingConfig {
  /** Log level (default: 'info') */
  level: LogLevel;
  
  /** Enable structured JSON logging (default: false) */
  json: boolean;
  
  /** Enable console logging (default: true) */
  console: boolean;
  
  /** File path for logging (optional) */
  filePath?: string;
}

export interface LocationMonitorConfig {
  /** Threshold configurations */
  thresholds: ThresholdConfig;
  
  /** Watchdog configurations */
  watchdog: WatchdogConfig;
  
  /** Geofencing configurations */
  geofence: GeofenceConfig;
  
  /** Logging configurations */
  logging: LoggingConfig;
  
  /** Storage driver instance */
  storageDriver: StorageDriver;
}

export const DEFAULT_CONFIG: Omit<LocationMonitorConfig, 'storageDriver'> = {
  thresholds: {
    idleAfter: 300000, // 5 minutes
    unreachableAfter: 30000, // 30 seconds
    offlineAfter: 600000, // 10 minutes
    minSpeed: 1.5, // km/h
    maxJumpDistance: 300, // meters
  },
  watchdog: {
    enabled: true,
    checkInterval: 5000, // 5 seconds
  },
  geofence: {
    enabled: true,
  },
  logging: {
    level: 'info',
    json: false,
    console: true,
  },
};

export interface CircularGeofence {
  id: string;
  name: string;
  type: 'circular';
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  metadata?: Record<string, any>;
}

export interface PolygonGeofence {
  id: string;
  name: string;
  type: 'polygon';
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  metadata?: Record<string, any>;
}

export type Geofence = CircularGeofence | PolygonGeofence;
