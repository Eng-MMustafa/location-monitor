/**
 * location-monitor - NestJS Example - Main Module
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { Module } from '@nestjs/common';
import { LocationMonitorModule, MemoryAdapter } from 'location-monitor';
import { EventsGateway } from './events.gateway';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [
    LocationMonitorModule.forRoot({
      storageDriver: new MemoryAdapter(),
      thresholds: {
        idleAfter: 300000, // 5 minutes
        unreachableAfter: 30000, // 30 seconds
        offlineAfter: 600000, // 10 minutes
        minSpeed: 1.5,
        maxJumpDistance: 300,
      },
      watchdog: {
        enabled: true,
        checkInterval: 5000,
      },
      geofence: {
        enabled: true,
      },
      logging: {
        level: 'info',
        json: false,
        console: true,
      },
    }),
  ],
  controllers: [LocationController],
  providers: [EventsGateway, LocationService],
})
export class AppModule {}
