/**
 * location-monitor - NestJS Module
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * NestJS module for easy integration
 */

import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LocationMonitorService } from '../location-monitor.service';
import { LocationMonitorConfig } from '../types/config.types';

@Global()
@Module({})
export class LocationMonitorModule implements OnModuleInit, OnModuleDestroy {
  private static service: LocationMonitorService;

  static forRoot(config: Partial<LocationMonitorConfig> & { storageDriver: any }): DynamicModule {
    const service = new LocationMonitorService(config);
    LocationMonitorModule.service = service;

    return {
      module: LocationMonitorModule,
      providers: [
        {
          provide: LocationMonitorService,
          useValue: service,
        },
      ],
      exports: [LocationMonitorService],
    };
  }

  async onModuleInit(): Promise<void> {
    if (LocationMonitorModule.service) {
      await LocationMonitorModule.service.initialize();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (LocationMonitorModule.service) {
      await LocationMonitorModule.service.shutdown();
    }
  }
}
