/**
 * location-monitor - Distance Calculator Tests
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 */

import {
    calculateBearing,
    calculateDistance,
    calculateSpeed,
    isAbnormalJump,
    isValidCoordinate,
} from '../src/utils/distance-calculator';

describe('Distance Calculator', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approximate)
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900000); // ~3935 km
      expect(distance).toBeLessThan(4000000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing correctly', () => {
      const bearing = calculateBearing(40.7128, -74.0060, 41.7128, -74.0060);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThanOrEqual(360);
    });
  });

  describe('calculateSpeed', () => {
    it('should calculate speed correctly', () => {
      const distanceMeters = 1000; // 1 km
      const timeMs = 3600000; // 1 hour
      const speed = calculateSpeed(distanceMeters, timeMs);
      expect(speed).toBe(1); // 1 km/h
    });

    it('should return 0 for zero time', () => {
      const speed = calculateSpeed(1000, 0);
      expect(speed).toBe(0);
    });
  });

  describe('isValidCoordinate', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinate(40.7128, -74.0060)).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(NaN, 0)).toBe(false);
      expect(isValidCoordinate(0, NaN)).toBe(false);
    });
  });

  describe('isAbnormalJump', () => {
    it('should detect abnormal jumps', () => {
      expect(isAbnormalJump(500, 5000, 300)).toBe(true);
      expect(isAbnormalJump(100, 5000, 300)).toBe(false);
    });

    it('should allow large distances for small time intervals', () => {
      expect(isAbnormalJump(500, 500, 300)).toBe(false);
    });
  });
});
