/**
 * location-monitor - Node.js Standalone Example
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Demonstrates standalone usage without NestJS
 */

import {
    LocationMonitorService,
    MemoryAdapter,
    MonitorEvent
} from '../src';

async function main() {
  console.log('=== Location Monitor - Standalone Example ===\n');
  console.log('Created by: Mohammed Mustafa (Senior Backend Engineer)\n');

  // Create storage adapter
  const storage = new MemoryAdapter();

  // Create location monitor service
  const monitor = new LocationMonitorService({
    storageDriver: storage,
    thresholds: {
      idleAfter: 10000, // 10 seconds for demo
      unreachableAfter: 5000, // 5 seconds for demo
      offlineAfter: 15000, // 15 seconds for demo
      minSpeed: 1.5,
      maxJumpDistance: 300,
    },
    watchdog: {
      enabled: true,
      checkInterval: 3000, // 3 seconds for demo
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

  // Subscribe to events
  await monitor.initialize();
  
  await monitor.subscribeEvents((event: MonitorEvent) => {
    console.log(`\n📡 Event: ${event.type}`);
    console.log('Payload:', JSON.stringify(event.payload, null, 2));
  });

  // Register geofences
  console.log('\n🗺️  Registering geofences...');
  monitor.registerGeofence({
    id: 'warehouse-1',
    name: 'Main Warehouse',
    type: 'circular',
    center: { latitude: 40.7128, longitude: -74.0060 },
    radius: 500, // 500 meters
  });

  monitor.registerGeofence({
    id: 'delivery-zone',
    name: 'Delivery Zone Downtown',
    type: 'polygon',
    coordinates: [
      { latitude: 40.7100, longitude: -74.0100 },
      { latitude: 40.7200, longitude: -74.0100 },
      { latitude: 40.7200, longitude: -74.0000 },
      { latitude: 40.7100, longitude: -74.0000 },
    ],
  });

  console.log('✅ Geofences registered\n');

  // Simulate multiple agents
  const agents = [
    { id: 'driver-001', name: 'John Doe' },
    { id: 'driver-002', name: 'Jane Smith' },
    { id: 'technician-001', name: 'Mike Johnson' },
  ];

  // Simulate location tracking
  console.log('🚗 Starting location tracking simulation...\n');

  // Initial locations
  await monitor.trackLocation('driver-001', 40.7128, -74.0060); // At warehouse
  await monitor.trackLocation('driver-002', 40.7150, -74.0050); // In delivery zone
  await monitor.trackLocation('technician-001', 40.7200, -74.0100); // Outside zones

  await sleep(2000);

  // Movement
  console.log('\n🚀 Simulating movement...\n');
  await monitor.trackLocation('driver-001', 40.7130, -74.0058); // Moving
  await monitor.trackLocation('driver-002', 40.7155, -74.0048); // Moving

  await sleep(2000);

  // More movement
  await monitor.trackLocation('driver-001', 40.7140, -74.0050); // Exiting warehouse geofence
  await monitor.trackLocation('driver-002', 40.7160, -74.0045); // Still in delivery zone

  await sleep(2000);

  // Get agent status
  console.log('\n📊 Current Agent States:\n');
  for (const agent of agents) {
    const state = await monitor.getAgentState(agent.id);
    if (state) {
      console.log(`${agent.name} (${agent.id}):`);
      console.log(`  Status: ${state.status}`);
      console.log(`  Location: ${state.lastLocation?.latitude}, ${state.lastLocation?.longitude}`);
      console.log(`  Active Geofences: ${state.activeGeofences.join(', ') || 'None'}`);
      console.log('');
    }
  }

  // Simulate agent going offline (no updates for a while)
  console.log('\n⏱️  Waiting for watchdog to detect unreachable agents...\n');
  await sleep(10000);

  // Get final status
  console.log('\n📊 Final Agent States:\n');
  for (const agent of agents) {
    const status = await monitor.getStatus(agent.id);
    console.log(`${agent.name}: ${status}`);
  }

  // Get statistics
  console.log('\n📈 Agent Statistics:\n');
  for (const agent of agents) {
    const stats = await monitor.getAgentStats(agent.id);
    if (stats) {
      console.log(`${agent.name}:`);
      console.log(`  Total Locations: ${stats.totalLocations}`);
      console.log(`  Total Distance: ${stats.totalDistance.toFixed(2)}m`);
      console.log('');
    }
  }

  // Shutdown
  console.log('\n🛑 Shutting down...\n');
  await monitor.shutdown();
  console.log('✅ Demo completed!\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the demo
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
