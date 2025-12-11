/**
 * location-monitor - Location Monitor Service Integration Tests
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { AgentStatus, EventType, MonitorEvent } from '../src/events/event-types';
import { LocationMonitorService } from '../src/location-monitor.service';
import { MemoryAdapter } from '../src/storage/memory.adapter';

describe('LocationMonitorService Integration', () => {
  let service: LocationMonitorService;
  let storage: MemoryAdapter;

  beforeEach(async () => {
    storage = new MemoryAdapter();
    service = new LocationMonitorService({
      storageDriver: storage,
      thresholds: {
        idleAfter: 5000,
        unreachableAfter: 2000,
        offlineAfter: 10000,
        minSpeed: 1.5,
        maxJumpDistance: 300,
      },
      watchdog: {
        enabled: false, // Disable for tests
        checkInterval: 1000,
      },
      geofence: {
        enabled: true,
      },
      logging: {
        level: 'error',
        json: false,
        console: false,
      },
    });

    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(service).toBeDefined();
    });
  });

  describe('location tracking', () => {
    it('should track location and detect status', async () => {
      const location = await service.trackLocation('agent-001', 40.7128, -74.0060);

      expect(location.agentId).toBe('agent-001');
      expect(location.latitude).toBe(40.7128);

      const status = await service.getStatus('agent-001');
      expect(status).toBeDefined();
    });

    it('should handle multiple agents', async () => {
      await service.trackLocation('agent-001', 40.7128, -74.0060);
      await service.trackLocation('agent-002', 40.7228, -74.0060);
      await service.trackLocation('agent-003', 40.7328, -74.0060);

      const agents = await service.getAllAgents();
      expect(agents).toHaveLength(3);
    });
  });

  describe('geofencing', () => {
    it('should register and detect geofence entry', async () => {
      service.registerGeofence({
        id: 'test-zone',
        name: 'Test Zone',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 500,
      });

      await service.trackLocation('agent-001', 40.7128, -74.0060);

      const geofences = service.getAgentGeofences('agent-001');
      expect(geofences).toHaveLength(1);
      expect(geofences[0].id).toBe('test-zone');
    });
  });

  describe('event subscription', () => {
    it('should receive location events', async () => {
      const events: MonitorEvent[] = [];

      await service.subscribeEvents((event) => {
        events.push(event);
      });

      await service.trackLocation('agent-001', 40.7128, -74.0060);

      // Wait a bit for events to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(events.length).toBeGreaterThan(0);
      const locationEvent = events.find((e) => e.type === EventType.LOCATION_RECEIVED);
      expect(locationEvent).toBeDefined();
    });
  });

  describe('agent state', () => {
    it('should maintain agent state', async () => {
      await service.trackLocation('agent-001', 40.7128, -74.0060);
      await service.trackLocation('agent-001', 40.7138, -74.0050);

      const state = await service.getAgentState('agent-001');

      expect(state).not.toBeNull();
      expect(state?.agentId).toBe('agent-001');
      expect(state?.lastLocation).toBeDefined();
      expect(state?.status).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should track agent statistics', async () => {
      await service.trackLocation('agent-001', 40.7128, -74.0060);
      await service.trackLocation('agent-001', 40.7138, -74.0050);
      await service.trackLocation('agent-001', 40.7148, -74.0040);

      const stats = await service.getAgentStats('agent-001');

      expect(stats).not.toBeNull();
      expect(stats?.totalLocations).toBe(3);
    });
  });

  describe('manual status control', () => {
    it('should allow manual status setting', async () => {
      await service.trackLocation('agent-001', 40.7128, -74.0060);
      await service.setStatus('agent-001', AgentStatus.IDLE, 'Manual override');

      const status = await service.getStatus('agent-001');
      expect(status).toBe(AgentStatus.IDLE);
    });
  });

  describe('concurrent agents tracking', () => {
    it('should handle multiple concurrent agents', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'];
      const locations = [
        { lat: 40.7128, lon: -74.0060 },
        { lat: 40.7589, lon: -73.9851 },
        { lat: 40.7614, lon: -73.9776 },
        { lat: 40.7489, lon: -73.9680 },
        { lat: 40.7306, lon: -73.9352 },
      ];

      // Track all agents simultaneously
      await Promise.all(
        agents.map((agentId, i) =>
          service.trackLocation(
            agentId,
            locations[i].lat,
            locations[i].lon,
            Date.now(),
            { index: i }
          )
        )
      );

      // Verify all agents are tracked
      for (const agentId of agents) {
        const state = await service.getAgentState(agentId);
        expect(state).not.toBeNull();
        if (state) {
          expect([AgentStatus.ACTIVE, AgentStatus.MOVING, AgentStatus.STOPPED]).toContain(state.status);
        }
      }
    });

    it('should handle load with 50 agents', async () => {
      const agentCount = 50;
      const updatesPerAgent = 5;

      const startTime = Date.now();

      for (let i = 0; i < agentCount; i++) {
        const agentId = `load-agent-${i}`;
        
        for (let j = 0; j < updatesPerAgent; j++) {
          await service.trackLocation(
            agentId,
            40.7128 + Math.random() * 0.01,
            -74.0060 + Math.random() * 0.01,
            Date.now()
          );
        }
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    }, 30000);
  });

  describe('status transitions with watchdog', () => {
    let serviceWithWatchdog: LocationMonitorService;
    let events: MonitorEvent[] = [];

    beforeEach(async () => {
      serviceWithWatchdog = new LocationMonitorService({
        storageDriver: new MemoryAdapter(),
        thresholds: {
          idleAfter: 3000,
          unreachableAfter: 2000,
          offlineAfter: 8000,
          minSpeed: 1.0,
          maxJumpDistance: 200,
        },
        watchdog: { enabled: true, checkInterval: 500 },
        geofence: { enabled: true },
      });

      await serviceWithWatchdog.initialize();
      await serviceWithWatchdog.subscribeEvents((event) => {
        events.push(event);
      });
    });

    afterEach(async () => {
      await serviceWithWatchdog.shutdown();
      events = [];
    });

    it('should detect agent becoming unreachable', async () => {
      const agentId = 'unreachable-agent';

      // Initial location
      await serviceWithWatchdog.trackLocation(agentId, 40.7128, -74.0060, Date.now());

      // Wait for unreachable threshold
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Check UNREACHABLE event
      const unreachableEvents = events.filter(
        (e) => e.type === EventType.AGENT_UNREACHABLE
      );
      expect(unreachableEvents.length).toBeGreaterThan(0);

      const state = await serviceWithWatchdog.getAgentState(agentId);
      if (state) {
        expect([AgentStatus.UNREACHABLE, AgentStatus.OFFLINE, AgentStatus.STOPPED]).toContain(state.status);
      }
    }, 10000);

    it('should detect agent coming back online', async () => {
      const agentId = 'comeback-agent';

      // Initial location
      await serviceWithWatchdog.trackLocation(agentId, 40.7128, -74.0060, Date.now());

      // Wait to become unreachable
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Send new location
      await serviceWithWatchdog.trackLocation(agentId, 40.7130, -74.0062, Date.now());

      // Verify BACK_ONLINE event or ACTIVE
      const onlineEvents = events.filter(
        (e) => e.type === EventType.AGENT_BACK_ONLINE || e.type === EventType.AGENT_ACTIVE
      );
      expect(onlineEvents.length).toBeGreaterThan(0);

      const state = await serviceWithWatchdog.getAgentState(agentId);
      if (state) {
        expect([AgentStatus.ACTIVE, AgentStatus.MOVING]).toContain(state.status);
      }
    }, 10000);
  });

  describe('geofence with multiple zones', () => {
    beforeEach(async () => {
      // Register multiple geofences
      service.registerGeofence({
        id: 'zone-a',
        name: 'Zone A',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      });

      service.registerGeofence({
        id: 'zone-b',
        name: 'Zone B',
        type: 'polygon',
        coordinates: [
          { latitude: 40.7500, longitude: -74.0000 },
          { latitude: 40.7600, longitude: -74.0000 },
          { latitude: 40.7600, longitude: -73.9900 },
          { latitude: 40.7500, longitude: -73.9900 },
        ],
      });

      service.registerGeofence({
        id: 'zone-c',
        name: 'Zone C',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 2000,
      });
    });

    it('should handle agent in multiple overlapping geofences', async () => {
      const agentId = 'multi-zone-agent';

      // Move to location inside both zone-a and zone-c
      await service.trackLocation(agentId, 40.7128, -74.0060, Date.now());

      // Verify agent is in both zones
      const geofences = service.getAgentGeofences(agentId);
      expect(geofences.length).toBe(2);
      expect(geofences.map((g) => g.id)).toContain('zone-a');
      expect(geofences.map((g) => g.id)).toContain('zone-c');
    });

    it('should track geofence transitions', async () => {
      const events: MonitorEvent[] = [];
      await service.subscribeEvents((event) => {
        events.push(event);
      });

      const agentId = 'transition-agent';

      // Start outside all zones
      await service.trackLocation(agentId, 40.7000, -74.0000, Date.now());

      // Move into zone-a
      await service.trackLocation(agentId, 40.7128, -74.0060, Date.now() + 1000);

      // Move into zone-b
      await service.trackLocation(agentId, 40.7550, -73.9950, Date.now() + 2000);

      // Verify events
      const entryEvents = events.filter(
        (e) => e.type === EventType.AGENT_ENTERED_GEOFENCE
      );
      const exitEvents = events.filter(
        (e) => e.type === EventType.AGENT_EXITED_GEOFENCE
      );

      expect(entryEvents.length).toBeGreaterThan(0);
      expect(exitEvents.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid coordinates', async () => {
      await expect(
        service.trackLocation('test', 91, 0, Date.now())
      ).rejects.toThrow();

      await expect(
        service.trackLocation('test', 0, -181, Date.now())
      ).rejects.toThrow();
    });

    it('should handle missing agent gracefully', async () => {
      const state = await service.getAgentState('non-existent-agent');
      expect(state).toBeNull();

      const status = await service.getStatus('non-existent-agent');
      expect(status).toBeNull();
    });

    it('should handle shutdown correctly', async () => {
      await service.trackLocation('test', 40.7128, -74.0060, Date.now());
      await service.shutdown();

      // Operations should fail after shutdown
      await expect(
        service.trackLocation('test', 40.7128, -74.0060, Date.now())
      ).rejects.toThrow();
    });
  });
});
