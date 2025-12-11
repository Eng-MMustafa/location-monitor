/**
 * location-monitor - Geo Engine Tests
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { GeoEngine } from '../src/core/geo-engine';
import { LocationData } from '../src/events/event-types';
import { MemoryAdapter } from '../src/storage/memory.adapter';
import { Geofence } from '../src/types/config.types';

describe('GeoEngine', () => {
  let engine: GeoEngine;
  let storage: MemoryAdapter;

  beforeEach(async () => {
    storage = new MemoryAdapter();
    await storage.initialize();
    engine = new GeoEngine(storage);
  });

  afterEach(async () => {
    await storage.disconnect();
  });

  describe('registerGeofence', () => {
    it('should register a circular geofence', () => {
      const geofence: Geofence = {
        id: 'zone-1',
        name: 'Test Zone',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 500,
      };

      engine.registerGeofence(geofence);
      
      const registered = engine.getGeofence('zone-1');
      expect(registered).toEqual(geofence);
    });

    it('should register a polygon geofence', () => {
      const geofence: Geofence = {
        id: 'zone-2',
        name: 'Polygon Zone',
        type: 'polygon',
        coordinates: [
          { latitude: 40.71, longitude: -74.01 },
          { latitude: 40.72, longitude: -74.01 },
          { latitude: 40.72, longitude: -74.00 },
          { latitude: 40.71, longitude: -74.00 },
        ],
      };

      engine.registerGeofence(geofence);
      
      const registered = engine.getGeofence('zone-2');
      expect(registered).toEqual(geofence);
    });

    it('should reject invalid geofence', () => {
      const geofence: any = {
        id: 'zone-3',
        name: 'Invalid',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: -100, // Invalid
      };

      expect(() => engine.registerGeofence(geofence)).toThrow();
    });
  });

  describe('checkGeofences', () => {
    it('should detect entry into circular geofence', async () => {
      const geofence: Geofence = {
        id: 'zone-1',
        name: 'Test Zone',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 500,
      };

      engine.registerGeofence(geofence);

      const location: LocationData = {
        agentId: 'agent-001',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now(),
      };

      await engine.checkGeofences('agent-001', location);

      expect(engine.isAgentInGeofence('agent-001', 'zone-1')).toBe(true);
    });

    it('should detect exit from geofence', async () => {
      const geofence: Geofence = {
        id: 'zone-1',
        name: 'Test Zone',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 100,
      };

      engine.registerGeofence(geofence);

      // Enter geofence
      const location1: LocationData = {
        agentId: 'agent-001',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now(),
      };
      await engine.checkGeofences('agent-001', location1);

      // Exit geofence
      const location2: LocationData = {
        agentId: 'agent-001',
        latitude: 41.0,
        longitude: -74.0,
        timestamp: Date.now(),
      };
      await engine.checkGeofences('agent-001', location2);

      expect(engine.isAgentInGeofence('agent-001', 'zone-1')).toBe(false);
    });
  });

  describe('getAgentsInGeofence', () => {
    it('should return all agents in a geofence', async () => {
      const geofence: Geofence = {
        id: 'zone-1',
        name: 'Test Zone',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 500,
      };

      engine.registerGeofence(geofence);

      const location1: LocationData = {
        agentId: 'agent-001',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now(),
      };

      const location2: LocationData = {
        agentId: 'agent-002',
        latitude: 40.7130,
        longitude: -74.0061,
        timestamp: Date.now(),
      };

      await engine.checkGeofences('agent-001', location1);
      await engine.checkGeofences('agent-002', location2);

      const agents = engine.getAgentsInGeofence('zone-1');
      expect(agents).toHaveLength(2);
      expect(agents).toContain('agent-001');
      expect(agents).toContain('agent-002');
    });
  });
});
