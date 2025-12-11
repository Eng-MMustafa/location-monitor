/**
 * location-monitor - Advanced Simulation Example
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Demonstrates comprehensive scenarios:
 * - Multiple simultaneous agents
 * - Status transitions (ACTIVE → MOVING → UNREACHABLE → OFFLINE)
 * - Geofence entry/exit
 * - Event handling
 * - Statistics tracking
 */

import {
    EventType,
    Geofence,
    LocationMonitorService,
    MemoryAdapter,
    MonitorEvent
} from '../src';

// Simulation configuration
const SIMULATION_CONFIG = {
  agents: 5,
  duration: 60000, // 1 minute
  updateInterval: 2000, // Update every 2 seconds
  movementSpeed: 0.001, // degrees per update
};

// Agent types with different behaviors
enum AgentBehavior {
  NORMAL = 'NORMAL',
  FAST_MOVER = 'FAST_MOVER',
  STATIONARY = 'STATIONARY',
  INTERMITTENT = 'INTERMITTENT', // Goes offline periodically
}

interface SimulatedAgent {
  id: string;
  name: string;
  behavior: AgentBehavior;
  currentLat: number;
  currentLon: number;
  targetLat: number;
  targetLon: number;
  isActive: boolean;
}

class LocationSimulation {
  private monitor!: LocationMonitorService;
  private agents: SimulatedAgent[] = [];
  private eventLog: MonitorEvent[] = [];
  private startTime!: number;

  async initialize() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Location Monitor - Advanced Simulation');
    console.log('  Created by: Mohammed Mustafa (Senior Backend Engineer)');
    console.log('═══════════════════════════════════════════════════════\n');

    // Create storage adapter
    const storage = new MemoryAdapter();

    // Create location monitor service
    this.monitor = new LocationMonitorService({
      storageDriver: storage,
      thresholds: {
        idleAfter: 10000, // 10 seconds
        unreachableAfter: 6000, // 6 seconds
        offlineAfter: 15000, // 15 seconds
        minSpeed: 1.5,
        maxJumpDistance: 300,
      },
      watchdog: {
        enabled: true,
        checkInterval: 2000, // Check every 2 seconds
      },
      geofence: {
        enabled: true,
      },
      logging: {
        level: 'info',
        json: false,
        console: true,
      },
    });

    await this.monitor.initialize();

    // Subscribe to all events
    await this.monitor.subscribeEvents((event) => {
      this.eventLog.push(event);
      this.logEvent(event);
    });

    console.log('✅ Monitor initialized\n');
  }

  setupGeofences() {
    console.log('📍 Setting up geofences...\n');

    const geofences: Geofence[] = [
      {
        id: 'downtown',
        name: 'Downtown Area',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
        metadata: { priority: 'high', zone: 'commercial' },
      },
      {
        id: 'warehouse',
        name: 'Main Warehouse',
        type: 'circular',
        center: { latitude: 40.7589, longitude: -73.9851 },
        radius: 500,
        metadata: { priority: 'critical', zone: 'logistics' },
      },
      {
        id: 'delivery-zone-1',
        name: 'Delivery Zone North',
        type: 'polygon',
        coordinates: [
          { latitude: 40.7100, longitude: -74.0100 },
          { latitude: 40.7200, longitude: -74.0100 },
          { latitude: 40.7200, longitude: -74.0000 },
          { latitude: 40.7100, longitude: -74.0000 },
        ],
        metadata: { zone: 'delivery' },
      },
    ];

    geofences.forEach((geofence) => {
      this.monitor.registerGeofence(geofence);
      console.log(`  ✓ ${geofence.name} (${geofence.type})`);
    });

    console.log('\n');
  }

  createAgents() {
    console.log('👥 Creating simulated agents...\n');

    const behaviors = [
      AgentBehavior.NORMAL,
      AgentBehavior.FAST_MOVER,
      AgentBehavior.STATIONARY,
      AgentBehavior.INTERMITTENT,
      AgentBehavior.NORMAL,
    ];

    for (let i = 0; i < SIMULATION_CONFIG.agents; i++) {
      const agent: SimulatedAgent = {
        id: `agent-${String(i + 1).padStart(3, '0')}`,
        name: `${this.getBehaviorName(behaviors[i])} Agent ${i + 1}`,
        behavior: behaviors[i],
        currentLat: 40.7128 + (Math.random() - 0.5) * 0.02,
        currentLon: -74.0060 + (Math.random() - 0.5) * 0.02,
        targetLat: 40.7128 + (Math.random() - 0.5) * 0.05,
        targetLon: -74.0060 + (Math.random() - 0.5) * 0.05,
        isActive: true,
      };

      this.agents.push(agent);
      console.log(`  ✓ ${agent.name} (${agent.id}) - ${agent.behavior}`);
    }

    console.log('\n');
  }

  async runSimulation() {
    console.log('🚀 Starting simulation...\n');
    this.startTime = Date.now();

    const updateInterval = setInterval(async () => {
      const elapsed = Date.now() - this.startTime;

      if (elapsed >= SIMULATION_CONFIG.duration) {
        clearInterval(updateInterval);
        await this.showResults();
        await this.monitor.shutdown();
        return;
      }

      // Update all agents
      for (const agent of this.agents) {
        await this.updateAgent(agent);
      }

      // Show progress
      const progress = Math.round((elapsed / SIMULATION_CONFIG.duration) * 100);
      process.stdout.write(`\r⏱️  Progress: ${progress}% | Elapsed: ${Math.round(elapsed / 1000)}s`);
    }, SIMULATION_CONFIG.updateInterval);
  }

  private async updateAgent(agent: SimulatedAgent) {
    // Handle different behaviors
    switch (agent.behavior) {
      case AgentBehavior.STATIONARY:
        // Only send location occasionally (will become IDLE)
        if (Math.random() > 0.8) {
          await this.trackAgentLocation(agent);
        }
        break;

      case AgentBehavior.INTERMITTENT:
        // Toggle active status
        if (Math.random() > 0.7) {
          agent.isActive = !agent.isActive;
        }
        if (agent.isActive) {
          await this.trackAgentLocation(agent);
          this.moveAgent(agent);
        }
        break;

      case AgentBehavior.FAST_MOVER:
        // Move faster
        this.moveAgent(agent, 2.5);
        await this.trackAgentLocation(agent);
        break;

      case AgentBehavior.NORMAL:
      default:
        // Normal movement
        this.moveAgent(agent);
        await this.trackAgentLocation(agent);
        break;
    }
  }

  private moveAgent(agent: SimulatedAgent, speedMultiplier = 1) {
    const speed = SIMULATION_CONFIG.movementSpeed * speedMultiplier;

    // Move towards target
    const latDiff = agent.targetLat - agent.currentLat;
    const lonDiff = agent.targetLon - agent.currentLon;
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

    if (distance < speed) {
      // Reached target, set new target
      agent.targetLat = 40.7128 + (Math.random() - 0.5) * 0.05;
      agent.targetLon = -74.0060 + (Math.random() - 0.5) * 0.05;
    } else {
      // Move towards target
      agent.currentLat += (latDiff / distance) * speed;
      agent.currentLon += (lonDiff / distance) * speed;
    }
  }

  private async trackAgentLocation(agent: SimulatedAgent) {
    try {
      await this.monitor.trackLocation(
        agent.id,
        agent.currentLat,
        agent.currentLon,
        Date.now(),
        {
          behavior: agent.behavior,
          name: agent.name,
        }
      );
    } catch (error) {
      // Ignore errors during simulation
    }
  }

  private async showResults() {
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Simulation Results');
    console.log('═══════════════════════════════════════════════════════\n');

    // Agent status summary
    console.log('📊 Final Agent States:\n');
    for (const agent of this.agents) {
      const state = await this.monitor.getAgentState(agent.id);
      if (state) {
        console.log(`  ${agent.name}:`);
        console.log(`    Status: ${state.status}`);
        console.log(`    Last Update: ${new Date(state.lastUpdate).toLocaleTimeString()}`);
        console.log(`    Active Geofences: ${state.activeGeofences.join(', ') || 'None'}`);
        
        const geofences = this.monitor.getAgentGeofences(agent.id);
        if (geofences.length > 0) {
          console.log(`    Geofence Details: ${geofences.map(g => g.name).join(', ')}`);
        }
        console.log('');
      }
    }

    // Statistics
    console.log('\n📈 Statistics:\n');
    for (const agent of this.agents) {
      const stats = await this.monitor.getAgentStats(agent.id);
      if (stats) {
        console.log(`  ${agent.name}:`);
        console.log(`    Total Locations: ${stats.totalLocations}`);
        console.log(`    Total Distance: ${stats.totalDistance.toFixed(2)}m`);
        console.log('');
      }
    }

    // Event summary
    console.log('\n🔔 Event Summary:\n');
    const eventCounts = this.eventLog.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([eventType, count]) => {
        console.log(`  ${eventType}: ${count} times`);
      });

    console.log(`\n  Total Events: ${this.eventLog.length}`);

    // Status transitions
    const statusChanges = this.eventLog.filter(e => e.type === EventType.STATUS_CHANGED);
    if (statusChanges.length > 0) {
      console.log('\n\n⚡ Status Transitions:\n');
      statusChanges.slice(-10).forEach((event: any) => {
        const payload = event.payload;
        console.log(`  ${payload.agentId}: ${payload.oldStatus} → ${payload.newStatus}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Simulation completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');
  }

  private logEvent(event: MonitorEvent) {
    // Don't log every location.received to avoid spam
    if (event.type === EventType.LOCATION_RECEIVED) return;

    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    console.log(`\n[${timestamp}] 📡 ${event.type}`);

    switch (event.type) {
      case EventType.STATUS_CHANGED:
        const statusPayload = event.payload as any;
        console.log(`   ${statusPayload.agentId}: ${statusPayload.oldStatus} → ${statusPayload.newStatus}`);
        break;

      case EventType.AGENT_ENTERED_GEOFENCE:
      case EventType.AGENT_EXITED_GEOFENCE:
        const geoPayload = event.payload as any;
        console.log(`   ${geoPayload.agentId} ${event.type.includes('entered') ? 'entered' : 'exited'} ${geoPayload.geofenceName}`);
        break;

      case EventType.AGENT_UNREACHABLE:
      case EventType.AGENT_BACK_ONLINE:
      case EventType.AGENT_IDLE:
      case EventType.AGENT_ACTIVE:
        const agentPayload = event.payload as any;
        console.log(`   ${agentPayload.agentId}`);
        break;
    }
  }

  private getBehaviorName(behavior: AgentBehavior): string {
    switch (behavior) {
      case AgentBehavior.NORMAL: return 'Normal';
      case AgentBehavior.FAST_MOVER: return 'Fast';
      case AgentBehavior.STATIONARY: return 'Stationary';
      case AgentBehavior.INTERMITTENT: return 'Intermittent';
    }
  }
}

// Run the simulation
async function main() {
  const simulation = new LocationSimulation();
  await simulation.initialize();
  simulation.setupGeofences();
  simulation.createAgents();
  await simulation.runSimulation();
}

main().catch((error) => {
  console.error('Simulation error:', error);
  process.exit(1);
});
