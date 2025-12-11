# Node.js Standalone Example

**Created by: Mohammed Mustafa (Senior Backend Engineer)**

This example demonstrates how to use location-monitor in a standalone Node.js application without NestJS.

## Features Demonstrated

- Creating a LocationMonitorService instance
- Configuring thresholds and watchdog settings
- Registering circular and polygon geofences
- Tracking multiple agents simultaneously
- Subscribing to real-time events
- Getting agent states and statistics
- Automatic status detection (ACTIVE, MOVING, UNREACHABLE, OFFLINE)

## Running the Example

```bash
npm install
npm start
```

## What This Example Does

1. **Initializes** the location monitor with custom configuration
2. **Registers** two geofences (warehouse and delivery zone)
3. **Simulates** three agents (two drivers and one technician)
4. **Tracks** location updates and movement
5. **Detects** geofence enter/exit events
6. **Monitors** agent status changes
7. **Displays** real-time events and final statistics

## Expected Output

You'll see:
- Location updates being tracked
- Geofence enter/exit events
- Status changes (ACTIVE → MOVING → UNREACHABLE)
- Real-time event notifications
- Agent statistics and final states
