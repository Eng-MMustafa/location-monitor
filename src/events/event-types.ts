/**
 * location-monitor - Event Types
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Defines all event types and payloads used throughout the library
 */

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  STOPPED = 'STOPPED',
  UNREACHABLE = 'UNREACHABLE',
  OFFLINE = 'OFFLINE',
}

export enum EventType {
  LOCATION_RECEIVED = 'location.received',
  STATUS_CHANGED = 'status.changed',
  AGENT_UNREACHABLE = 'agent.unreachable',
  AGENT_BACK_ONLINE = 'agent.back-online',
  AGENT_IDLE = 'agent.idle',
  AGENT_ACTIVE = 'agent.active',
  AGENT_ENTERED_GEOFENCE = 'agent.entered-geofence',
  AGENT_EXITED_GEOFENCE = 'agent.exited-geofence',
}

export interface LocationData {
  agentId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  metadata?: Record<string, any>;
}

export interface StatusChangePayload {
  agentId: string;
  oldStatus: AgentStatus;
  newStatus: AgentStatus;
  timestamp: number;
  reason?: string;
}

export interface LocationReceivedPayload {
  agentId: string;
  location: LocationData;
  distanceTraveled?: number;
  speed?: number;
}

export interface GeofenceEvent {
  agentId: string;
  geofenceId: string;
  geofenceName: string;
  location: LocationData;
  timestamp: number;
  eventType: 'enter' | 'exit';
}

export interface AgentStateSnapshot {
  agentId: string;
  status: AgentStatus;
  lastLocation?: LocationData;
  lastUpdate: number;
  lastMovement?: number;
  totalDistanceTraveled: number;
  activeGeofences: string[];
}

export type EventPayload =
  | LocationReceivedPayload
  | StatusChangePayload
  | GeofenceEvent
  | AgentStateSnapshot;

export interface MonitorEvent {
  type: EventType;
  payload: EventPayload;
  timestamp: number;
}
