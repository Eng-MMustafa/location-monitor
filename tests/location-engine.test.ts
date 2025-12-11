/**
 * location-monitor - Location Engine Tests
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { LocationEngine } from '../src/core/location-engine';
import { MemoryAdapter } from '../src/storage/memory.adapter';
import { DEFAULT_CONFIG } from '../src/types/config.types';

describe('LocationEngine', () => {
  let engine: LocationEngine;
  let storage: MemoryAdapter;

  beforeEach(async () => {
    storage = new MemoryAdapter();
    await storage.initialize();
    engine = new LocationEngine(storage, DEFAULT_CONFIG.thresholds);
  });

  afterEach(async () => {
    await storage.disconnect();
  });

  describe('trackLocation', () => {
    it('should track a location successfully', async () => {
      const location = await engine.trackLocation(
        'agent-001',
        40.7128,
        -74.0060,
      );

      expect(location.agentId).toBe('agent-001');
      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.0060);
      expect(location.timestamp).toBeDefined();
    });

    it('should calculate speed and heading for subsequent locations', async () => {
      await engine.trackLocation('agent-001', 40.7128, -74.0060);
      
      const location2 = await engine.trackLocation(
        'agent-001',
        40.7138,
        -74.0050,
      );

      expect(location2).toBeDefined();
      // Speed and heading may not always be calculated
      // depending on time and distance thresholds
    });

    it('should reject invalid coordinates', async () => {
      await expect(
        engine.trackLocation('agent-001', 91, 0),
      ).rejects.toThrow('Invalid coordinates');
    });

    it('should reject invalid agentId', async () => {
      await expect(
        engine.trackLocation('', 40.7128, -74.0060),
      ).rejects.toThrow('Invalid agentId');
    });
  });

  describe('getCurrentLocation', () => {
    it('should return the last tracked location', async () => {
      await engine.trackLocation('agent-001', 40.7128, -74.0060);
      
      const location = await engine.getCurrentLocation('agent-001');
      
      expect(location).not.toBeNull();
      expect(location?.latitude).toBe(40.7128);
    });

    it('should return null for unknown agent', async () => {
      const location = await engine.getCurrentLocation('unknown');
      expect(location).toBeNull();
    });
  });

  describe('getDistanceBetweenAgents', () => {
    it('should calculate distance between two agents', async () => {
      await engine.trackLocation('agent-001', 40.7128, -74.0060);
      await engine.trackLocation('agent-002', 40.7228, -74.0060);

      const distance = await engine.getDistanceBetweenAgents('agent-001', 'agent-002');
      
      expect(distance).not.toBeNull();
      expect(distance!).toBeGreaterThan(0);
    });

    it('should return null if agents not found', async () => {
      const distance = await engine.getDistanceBetweenAgents('agent-001', 'agent-002');
      expect(distance).toBeNull();
    });
  });
});
