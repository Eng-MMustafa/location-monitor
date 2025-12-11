/**
 * location-monitor - Geo Utils Additional Tests
 * Test coverage for uncovered geo utility functions
 */

import { CircularGeofence, Geofence, PolygonGeofence } from '../src/types/config.types';
import {
    distanceToGeofence,
    getContainingGeofences,
    getPolygonCenter,
    isPointInCircle,
    isPointInGeofence,
    isPointInPolygon,
    validateGeofence
} from '../src/utils/geo.utils';

describe('Geo Utils - Additional Coverage', () => {
  describe('isPointInCircle', () => {
    it('should detect point inside circle', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      };
      
      expect(isPointInCircle(40.7128, -74.0060, geofence)).toBe(true);
    });

    it('should detect point outside circle', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 100,
      };
      
      expect(isPointInCircle(50.0, -100.0, geofence)).toBe(false);
    });
  });

  describe('isPointInPolygon', () => {
    it('should detect point inside polygon', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -73.0 },
          { latitude: 40.0, longitude: -73.0 },
        ],
      };
      
      expect(isPointInPolygon(40.5, -73.5, geofence)).toBe(true);
    });

    it('should detect point outside polygon', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -73.0 },
        ],
      };
      
      expect(isPointInPolygon(50.0, -80.0, geofence)).toBe(false);
    });
  });

  describe('isPointInGeofence', () => {
    it('should work with circular geofence', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      };
      
      expect(isPointInGeofence(40.7128, -74.0060, geofence)).toBe(true);
    });

    it('should work with polygon geofence', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -73.0 },
          { latitude: 40.0, longitude: -73.0 },
        ],
      };
      
      expect(isPointInGeofence(40.5, -73.5, geofence)).toBe(true);
    });
  });

  describe('getContainingGeofences', () => {
    it('should find all containing geofences', () => {
      const geofences: Geofence[] = [
        {
          id: 'circle-1',
          name: 'Circle 1',
          type: 'circular',
          center: { latitude: 40.7128, longitude: -74.0060 },
          radius: 10000,
        },
        {
          id: 'circle-2',
          name: 'Circle 2',
          type: 'circular',
          center: { latitude: 50.0, longitude: -100.0 },
          radius: 1000,
        },
      ];
      
      const containing = getContainingGeofences(40.7128, -74.0060, geofences);
      expect(containing.length).toBe(1);
      expect(containing[0].id).toBe('circle-1');
    });

    it('should return empty array when no geofences contain point', () => {
      const geofences: Geofence[] = [
        {
          id: 'circle-1',
          name: 'Circle 1',
          type: 'circular',
          center: { latitude: 40.7128, longitude: -74.0060 },
          radius: 100,
        },
      ];
      
      const containing = getContainingGeofences(50.0, -100.0, geofences);
      expect(containing.length).toBe(0);
    });
  });

  describe('getPolygonCenter', () => {
    it('should calculate polygon center', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 42.0, longitude: -74.0 },
          { latitude: 42.0, longitude: -72.0 },
          { latitude: 40.0, longitude: -72.0 },
        ],
      };
      
      const center = getPolygonCenter(geofence);
      expect(center.latitude).toBeCloseTo(41.0, 0);
      expect(center.longitude).toBeCloseTo(-73.0, 0);
    });
  });

  describe('distanceToGeofence', () => {
    it('should calculate distance to circular geofence', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      };
      
      const distance = distanceToGeofence(40.7128, -74.0060, geofence);
      expect(distance).toBeCloseTo(1000, -2);
    });

    it('should calculate distance to polygon geofence', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -73.0 },
          { latitude: 40.0, longitude: -73.0 },
        ],
      };
      
      const distance = distanceToGeofence(40.5, -73.5, geofence);
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateGeofence', () => {
    it('should validate valid circular geofence', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate valid polygon geofence', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -73.0 },
        ],
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid circular geofence', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: -100,
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject polygon with too few vertices', () => {
      const geofence: PolygonGeofence = {
        id: 'poly-1',
        name: 'Test Polygon',
        type: 'polygon',
        coordinates: [
          { latitude: 40.0, longitude: -74.0 },
          { latitude: 41.0, longitude: -74.0 },
        ],
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Polygon must have at least 3 vertices');
    });

    it('should reject geofence with invalid coordinates', () => {
      const geofence: CircularGeofence = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circular',
        center: { latitude: 95, longitude: -74.0060 },
        radius: 1000,
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid center coordinates');
    });

    it('should reject geofence without id or name', () => {
      const geofence: any = {
        type: 'circular',
        center: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000,
      };
      
      const result = validateGeofence(geofence);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Geofence must have id and name');
    });
  });
});
