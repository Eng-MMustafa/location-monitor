# Advanced Simulation Example

This example demonstrates comprehensive location tracking scenarios with multiple agents and behaviors.

## Created by
**Mohammed Mustafa (Senior Backend Engineer)**

## Features Demonstrated

- ✅ Multiple simultaneous agents (5 agents)
- ✅ Different agent behaviors:
  - **Normal**: Regular movement patterns
  - **Fast Mover**: High-speed movement
  - **Stationary**: Minimal movement (becomes IDLE)
  - **Intermittent**: Periodic online/offline cycles
- ✅ Multiple geofences:
  - Circular geofences
  - Polygon geofences
  - Overlapping geofences
- ✅ Status transitions:
  - ACTIVE → IDLE
  - IDLE → UNREACHABLE
  - UNREACHABLE → OFFLINE
  - OFFLINE → ACTIVE (back online)
- ✅ Real-time event tracking
- ✅ Statistics collection
- ✅ Geofence entry/exit detection

## Installation

```bash
npm install
```

## Running the Simulation

```bash
npm start
```

## Configuration

Edit `index.ts` to customize:

```typescript
const SIMULATION_CONFIG = {
  agents: 5,              // Number of agents to simulate
  duration: 60000,        // Simulation duration (1 minute)
  updateInterval: 2000,   // Update frequency (2 seconds)
  movementSpeed: 0.001,   // Movement speed (degrees per update)
};
```

## Expected Output

The simulation will show:
1. **Initialization**: Monitor setup and geofence registration
2. **Agent Creation**: List of simulated agents with their behaviors
3. **Real-time Events**: Status changes, geofence transitions, etc.
4. **Progress Tracking**: Percentage completion
5. **Final Results**: 
   - Final agent states
   - Statistics (total locations, distance traveled)
   - Event summary

## Example Output

```
═══════════════════════════════════════════════════════
  Location Monitor - Advanced Simulation
  Created by: Mohammed Mustafa (Senior Backend Engineer)
═══════════════════════════════════════════════════════

✅ Monitor initialized

📍 Setting up geofences...
  ✓ Downtown Area (circular)
  ✓ Main Warehouse (circular)
  ✓ Delivery Zone North (polygon)

👥 Creating simulated agents...
  ✓ Normal Agent 1 (agent-001) - NORMAL
  ✓ Fast Agent 2 (agent-002) - FAST_MOVER
  ✓ Stationary Agent 3 (agent-003) - STATIONARY
  ✓ Intermittent Agent 4 (agent-004) - INTERMITTENT
  ✓ Normal Agent 5 (agent-005) - NORMAL

🚀 Starting simulation...

[14:32:15] 📡 status.changed
   agent-003: ACTIVE → IDLE

[14:32:17] 📡 agent.entered-geofence
   agent-002 entered Downtown Area

... (real-time updates)

═══════════════════════════════════════════════════════
  Simulation Results
═══════════════════════════════════════════════════════

📊 Final Agent States:
  Normal Agent 1:
    Status: ACTIVE
    Last Update: 14:33:15 PM
    Active Geofences: downtown
    Geofence Details: Downtown Area
    
  Fast Agent 2:
    Status: MOVING
    Last Update: 14:33:15 PM
    Active Geofences: warehouse
    Geofence Details: Main Warehouse

📈 Statistics:
  Normal Agent 1:
    Total Locations: 30
    Total Distance: 1234.56m
    
  Fast Agent 2:
    Total Locations: 30
    Total Distance: 3456.78m

🔔 Event Summary:
  location.received: 150 times
  status.changed: 12 times
  agent.entered-geofence: 8 times
  agent.exited-geofence: 7 times
  agent.unreachable: 3 times
  agent.back-online: 2 times
  agent.idle: 4 times

  Total Events: 186

⚡ Status Transitions:
  agent-003: ACTIVE → IDLE
  agent-004: ACTIVE → UNREACHABLE
  agent-002: IDLE → ACTIVE
  agent-004: UNREACHABLE → ACTIVE
  agent-001: MOVING → ACTIVE
  ...

═══════════════════════════════════════════════════════
✅ Simulation completed successfully!
═══════════════════════════════════════════════════════
```

## Customization

### Adding More Agent Behaviors

Edit the `AgentBehavior` enum and update logic:

```typescript
enum AgentBehavior {
  NORMAL = 'NORMAL',
  FAST_MOVER = 'FAST_MOVER',
  STATIONARY = 'STATIONARY',
  INTERMITTENT = 'INTERMITTENT',
  CUSTOM = 'CUSTOM',  // Add your custom behavior
}

// Implement custom behavior in updateAgent method
case AgentBehavior.CUSTOM:
  // Your custom logic here
  break;
```

### Adding More Geofences

Modify `setupGeofences()` method:

```typescript
const geofences: Geofence[] = [
  // ... existing geofences
  {
    id: 'custom-zone',
    name: 'Custom Zone',
    type: 'circular',
    center: { latitude: 40.7500, longitude: -74.0100 },
    radius: 750,
    metadata: { priority: 'medium', zone: 'custom' },
  },
];
```

## Use Cases

This simulation is perfect for:
- **Testing**: Validate your location tracking implementation
- **Demonstration**: Show stakeholders how the system works
- **Load Testing**: Increase agent count to test performance
- **Development**: Understand event flow and status transitions
- **Debugging**: Identify edge cases and timing issues

## Learn More

- [Main Documentation](../../README.md)
- [API Reference](../../docs/API.md)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Made with ❤️ by Mohammed Mustafa (Senior Backend Engineer)**
