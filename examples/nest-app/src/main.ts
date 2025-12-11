/**
 * location-monitor - NestJS Example - Main Entry Point
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  await app.listen(3000);
  
  console.log('\n=== Location Monitor - NestJS Example ===');
  console.log('Created by: Mohammed Mustafa (Senior Backend Engineer)\n');
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📡 WebSocket server running on ws://localhost:3000\n');
  console.log('API Endpoints:');
  console.log('  POST /location/track - Track agent location');
  console.log('  GET  /location/agents - Get all agents');
  console.log('  GET  /location/agents/:id - Get agent status');
  console.log('  GET  /location/agents/:id/location - Get agent location');
  console.log('  GET  /location/agents/:id/stats - Get agent statistics');
  console.log('  POST /location/agents/:id/status - Set agent status');
  console.log('  GET  /location/geofences - Get all geofences');
  console.log('  GET  /location/agents/:id/geofences - Get agent geofences\n');
}

bootstrap();
