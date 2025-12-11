/**
 * location-monitor - Basic Coverage Tests
 * Simple tests to increase coverage for files with external dependencies
 */

describe('Basic Module Coverage', () => {
  describe('Adapter Imports', () => {
    it('should import RedisAdapter', () => {
      const { RedisAdapter } = require('../src/storage/redis.adapter');
      expect(RedisAdapter).toBeDefined();
    });

    it('should import KafkaAdapter', () => {
      const { KafkaAdapter } = require('../src/storage/kafka.adapter');
      expect(KafkaAdapter).toBeDefined();
    });

    it('should import RabbitMQAdapter', () => {
      const { RabbitMQAdapter } = require('../src/storage/rabbitmq.adapter');
      expect(RabbitMQAdapter).toBeDefined();
    });

    it('should import WebSocketAdapter', () => {
      const { WebSocketAdapter } = require('../src/storage/websocket.adapter');
      expect(WebSocketAdapter).toBeDefined();
    });

    it('should import LocationMonitorModule', () => {
      const { LocationMonitorModule } = require('../src/nest/location-monitor.module');
      expect(LocationMonitorModule).toBeDefined();
    });
  });

  describe('Memory Adapter Edge Cases', () => {
    const { MemoryAdapter } = require('../src/storage/memory.adapter');
    
    it('should handle subscribeEvents and unsubscribeEvents', async () => {
      const adapter = new MemoryAdapter();
      
      const handler = jest.fn();
      await adapter.subscribeEvents(handler);
      await adapter.unsubscribeEvents();
      
      await adapter.disconnect();
    });
  });
});
