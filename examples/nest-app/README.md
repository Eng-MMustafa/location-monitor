# NestJS Example

**Created by: Mohammed Mustafa (Senior Backend Engineer)**

This example demonstrates how to integrate location-monitor into a NestJS application with REST API and WebSocket support.

## Features

- **REST API** for location tracking and agent management
- **WebSocket Gateway** for real-time event broadcasting
- **Dependency Injection** using NestJS modules
- **Geofence Management** with predefined zones
- **Real-time Status Updates** via WebSocket

## Installation

```bash
npm install
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The server will start on `http://localhost:3000`

## API Endpoints

### Track Location
```http
POST /location/track
Content-Type: application/json

{
  "agentId": "driver-001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "metadata": {
    "vehicleId": "VEH-123",
    "speed": 45
  }
}
```

### Get All Agents
```http
GET /location/agents
```

### Get Agent Status
```http
GET /location/agents/driver-001
```

### Get Agent Location
```http
GET /location/agents/driver-001/location
```

### Get Agent Statistics
```http
GET /location/agents/driver-001/stats
```

### Set Agent Status
```http
POST /location/agents/driver-001/status
Content-Type: application/json

{
  "status": "ACTIVE",
  "reason": "Manual override"
}
```

### Get All Geofences
```http
GET /location/geofences
```

### Get Agent Geofences
```http
GET /location/agents/driver-001/geofences
```

## WebSocket Events

Connect to `ws://localhost:3000` and listen for `location-event` events:

```javascript
const socket = io('http://localhost:3000');

socket.on('location-event', (event) => {
  console.log('Event:', event.type);
  console.log('Payload:', event.payload);
});
```

## Testing with cURL

```bash
# Track a location
curl -X POST http://localhost:3000/location/track \
  -H "Content-Type: application/json" \
  -d '{"agentId":"driver-001","latitude":40.7128,"longitude":-74.0060}'

# Get agent status
curl http://localhost:3000/location/agents/driver-001

# Get all agents
curl http://localhost:3000/location/agents
```

## Architecture

- **AppModule**: Main application module with LocationMonitorModule integration
- **LocationController**: REST API endpoints for location tracking
- **EventsGateway**: WebSocket gateway for real-time events
- **LocationService**: Service for managing geofences and initialization
