/**
 * location-monitor - Main Export
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Main entry point for the library
 */

// Main Service
export { LocationMonitorService } from './location-monitor.service';

// NestJS Module
export { LocationMonitorModule } from './nest/location-monitor.module';

// Core Engines
export { GeoEngine } from './core/geo-engine';
export { LocationEngine } from './core/location-engine';
export { StatusEngine } from './core/status-engine';
export { WatchdogEngine } from './core/watchdog-engine';

// Storage Drivers
export { KafkaAdapter, KafkaAdapterConfig } from './storage/kafka.adapter';
export { MemoryAdapter } from './storage/memory.adapter';
export { RabbitMQAdapter, RabbitMQAdapterConfig } from './storage/rabbitmq.adapter';
export { RedisAdapter, RedisAdapterConfig } from './storage/redis.adapter';
export { StorageDriver } from './storage/storage-driver.interface';
export { WebSocketAdapter, WebSocketAdapterConfig } from './storage/websocket.adapter';

// Types and Interfaces
export {
    CircularGeofence, DEFAULT_CONFIG,
    Geofence, GeofenceConfig, LocationMonitorConfig, LoggingConfig, PolygonGeofence, ThresholdConfig,
    WatchdogConfig
} from './types/config.types';

export {
    AgentStateSnapshot, AgentStatus, EventPayload, EventType, GeofenceEvent, LocationData, LocationReceivedPayload, MonitorEvent, StatusChangePayload
} from './events/event-types';

// Utilities
export {
    calculateBearing, calculateDestination, calculateDistance, calculateSpeed, isAbnormalJump, isValidCoordinate
} from './utils/distance-calculator';
export {
    distanceToGeofence, getContainingGeofences,
    getPolygonCenter, isPointInCircle, isPointInGeofence, isPointInPolygon, validateGeofence
} from './utils/geo.utils';
export { LogLevel, Logger, getLogger, setLogger } from './utils/logger';
export {
    delay, endOfDay, formatDuration, isOlderThan, isValidTimestamp, isWithin, now, parseDuration, startOfDay, timeAgo
} from './utils/time.utils';

