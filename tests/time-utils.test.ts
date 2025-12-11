/**
 * location-monitor - Time Utils Tests
 * Test coverage for time utility functions
 */

import {
    delay,
    endOfDay,
    formatDuration,
    isOlderThan,
    isValidTimestamp,
    isWithin,
    now,
    parseDuration,
    startOfDay,
    timeAgo
} from '../src/utils/time.utils';

describe('Time Utils', () => {
  describe('now', () => {
    it('should return current timestamp', () => {
      const timestamp = now();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('isOlderThan', () => {
    it('should return true for old timestamps', () => {
      const oldTimestamp = Date.now() - 10000;
      expect(isOlderThan(oldTimestamp, 5000)).toBe(true);
    });

    it('should return false for recent timestamps', () => {
      const recentTimestamp = Date.now() - 1000;
      expect(isOlderThan(recentTimestamp, 5000)).toBe(false);
    });
  });

  describe('isWithin', () => {
    it('should return true for timestamps within duration', () => {
      const recentTimestamp = Date.now() - 1000;
      expect(isWithin(recentTimestamp, 5000)).toBe(true);
    });

    it('should return false for old timestamps', () => {
      const oldTimestamp = Date.now() - 10000;
      expect(isWithin(oldTimestamp, 5000)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toContain('s');
    });

    it('should format minutes', () => {
      expect(formatDuration(65000)).toContain('m');
    });

    it('should format hours', () => {
      expect(formatDuration(3665000)).toContain('h');
    });

    it('should format days', () => {
      expect(formatDuration(86400000 + 3600000)).toContain('d');
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds', () => {
      expect(parseDuration('30s')).toBe(30000);
    });

    it('should parse minutes', () => {
      expect(parseDuration('5m')).toBe(300000);
    });

    it('should parse hours', () => {
      expect(parseDuration('2h')).toBe(7200000);
    });

    it('should parse days', () => {
      expect(parseDuration('1d')).toBe(86400000);
    });

    it('should throw for invalid format', () => {
      expect(() => parseDuration('invalid')).toThrow();
    });
  });

  describe('delay', () => {
    it('should create delay promise', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('timeAgo', () => {
    it('should return "just now" for current time', () => {
      expect(timeAgo(Date.now())).toBe('just now');
    });

    it('should return seconds ago', () => {
      const timestamp = Date.now() - 5000;
      expect(timeAgo(timestamp)).toContain('second');
    });

    it('should return minutes ago', () => {
      const timestamp = Date.now() - 65000;
      expect(timeAgo(timestamp)).toContain('minute');
    });

    it('should return hours ago', () => {
      const timestamp = Date.now() - 3665000;
      expect(timeAgo(timestamp)).toContain('hour');
    });

    it('should return days ago', () => {
      const timestamp = Date.now() - 86500000;
      expect(timeAgo(timestamp)).toContain('day');
    });
  });

  describe('isValidTimestamp', () => {
    it('should validate valid timestamps', () => {
      expect(isValidTimestamp(Date.now())).toBe(true);
      expect(isValidTimestamp(Date.now() - 1000)).toBe(true);
    });

    it('should reject invalid timestamps', () => {
      expect(isValidTimestamp(0)).toBe(false);
      expect(isValidTimestamp(-1)).toBe(false);
      expect(isValidTimestamp(NaN)).toBe(false);
    });

    it('should reject far future timestamps', () => {
      const farFuture = Date.now() + 100000;
      expect(isValidTimestamp(farFuture)).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should get start of day', () => {
      const timestamp = new Date('2024-01-01T15:30:00Z').getTime();
      const start = startOfDay(timestamp);
      const date = new Date(start);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should use current day if no timestamp provided', () => {
      const start = startOfDay();
      expect(typeof start).toBe('number');
      expect(start).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('endOfDay', () => {
    it('should get end of day', () => {
      const timestamp = new Date('2024-01-01T15:30:00Z').getTime();
      const end = endOfDay(timestamp);
      const date = new Date(end);
      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
      expect(date.getSeconds()).toBe(59);
    });

    it('should use current day if no timestamp provided', () => {
      const end = endOfDay();
      expect(typeof end).toBe('number');
      expect(end).toBeGreaterThan(Date.now());
    });
  });
});
