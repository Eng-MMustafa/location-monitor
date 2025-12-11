/**
 * location-monitor - NestJS Example - Location Service
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { LocationMonitorService } from 'location-monitor';

@Injectable()
export class LocationService implements OnModuleInit {
  constructor(private readonly monitor: LocationMonitorService) {}

  async onModuleInit(): Promise<void> {
    // Register some default geofences
    this.monitor.registerGeofence({
      id: 'headquarters',
      name: 'Company Headquarters',
      type: 'circular',
      center: { latitude: 40.7128, longitude: -74.0060 },
      radius: 200,
    });

    this.monitor.registerGeofence({
      id: 'warehouse-north',
      name: 'North Warehouse',
      type: 'circular',
      center: { latitude: 40.7589, longitude: -73.9851 },
      radius: 300,
    });

    this.monitor.registerGeofence({
      id: 'delivery-zone-1',
      name: 'Delivery Zone 1',
      type: 'polygon',
      coordinates: [
        { latitude: 40.7100, longitude: -74.0100 },
        { latitude: 40.7200, longitude: -74.0100 },
        { latitude: 40.7200, longitude: -74.0000 },
        { latitude: 40.7100, longitude: -74.0000 },
      ],
    });

    console.log('✅ Default geofences registered');
  }
}
