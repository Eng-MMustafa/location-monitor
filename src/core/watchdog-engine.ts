/**
 * location-monitor - Watchdog Engine
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Background engine that monitors agent states and triggers status updates
 */

import { StorageDriver } from '../storage/storage-driver.interface';
import { WatchdogConfig } from '../types/config.types';
import { getLogger } from '../utils/logger';
import { StatusEngine } from './status-engine';

export class WatchdogEngine {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private logger = getLogger();

  constructor(
    private storage: StorageDriver,
    private statusEngine: StatusEngine,
    private config: WatchdogConfig,
  ) {}

  /**
   * Start the watchdog engine
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Watchdog engine already running');
      return;
    }

    if (!this.config.enabled) {
      this.logger.info('Watchdog engine disabled');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting watchdog engine', {
      checkInterval: this.config.checkInterval,
    });

    this.intervalId = setInterval(
      () => this.performCheck(),
      this.config.checkInterval,
    );
  }

  /**
   * Stop the watchdog engine
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.logger.info('Watchdog engine stopped');
  }

  /**
   * Check if watchdog is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Perform watchdog check on all agents
   */
  private async performCheck(): Promise<void> {
    try {
      const agents = await this.storage.getAllAgents();

      this.logger.debug('Watchdog check', { agentCount: agents.length });

      // Check each agent's status
      const checks = agents.map((agentId) => this.checkAgent(agentId));
      await Promise.allSettled(checks);
    } catch (error) {
      this.logger.error('Watchdog check failed', error as Error);
    }
  }

  /**
   * Check individual agent status
   */
  private async checkAgent(agentId: string): Promise<void> {
    try {
      await this.statusEngine.checkStatusByTime(agentId);
    } catch (error) {
      this.logger.error(`Watchdog check failed for agent ${agentId}`, error as Error);
    }
  }

  /**
   * Force check a specific agent immediately
   */
  async forceCheck(agentId: string): Promise<void> {
    await this.checkAgent(agentId);
  }

  /**
   * Force check all agents immediately
   */
  async forceCheckAll(): Promise<void> {
    await this.performCheck();
  }
}
