/**
 * location-monitor - NestJS Example - Location Controller
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
} from '@nestjs/common';
import { AgentStatus, LocationData, LocationMonitorService } from 'location-monitor';

@Controller('location')
export class LocationController {
  constructor(private readonly monitor: LocationMonitorService) {}

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async trackLocation(
    @Body() body: {
      agentId: string;
      latitude: number;
      longitude: number;
      timestamp?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<LocationData> {
    return this.monitor.trackLocation(
      body.agentId,
      body.latitude,
      body.longitude,
      body.timestamp,
      body.metadata,
    );
  }

  @Get('agents')
  async getAllAgents(): Promise<{ agents: string[] }> {
    const agents = await this.monitor.getAllAgents();
    return { agents };
  }

  @Get('agents/:agentId')
  async getAgentStatus(@Param('agentId') agentId: string) {
    const state = await this.monitor.getAgentState(agentId);
    
    if (!state) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    return state;
  }

  @Get('agents/:agentId/location')
  async getAgentLocation(@Param('agentId') agentId: string): Promise<LocationData> {
    const location = await this.monitor.getLocation(agentId);
    
    if (!location) {
      throw new NotFoundException(`No location data for agent ${agentId}`);
    }

    return location;
  }

  @Get('agents/:agentId/stats')
  async getAgentStats(@Param('agentId') agentId: string) {
    const stats = await this.monitor.getAgentStats(agentId);
    
    if (!stats) {
      throw new NotFoundException(`No stats for agent ${agentId}`);
    }

    return stats;
  }

  @Post('agents/:agentId/status')
  @HttpCode(HttpStatus.OK)
  async setAgentStatus(
    @Param('agentId') agentId: string,
    @Body() body: { status: AgentStatus; reason?: string },
  ): Promise<{ success: boolean }> {
    await this.monitor.setStatus(agentId, body.status, body.reason);
    return { success: true };
  }

  @Get('geofences')
  async getGeofences() {
    const geofences = this.monitor.getGeofences();
    return { geofences };
  }

  @Get('agents/:agentId/geofences')
  async getAgentGeofences(@Param('agentId') agentId: string) {
    const geofences = this.monitor.getAgentGeofences(agentId);
    return { geofences };
  }
}
