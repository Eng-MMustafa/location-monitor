/**
 * location-monitor - Geo Utilities
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Geographic utilities for geofencing and point-in-polygon calculations
 */

import { CircularGeofence, Geofence, PolygonGeofence } from '../types/config.types';
import { calculateDistance } from './distance-calculator';

/**
 * Check if a point is inside a circular geofence
 */
export function isPointInCircle(
  latitude: number,
  longitude: number,
  geofence: CircularGeofence,
): boolean {
  const distance = calculateDistance(
    latitude,
    longitude,
    geofence.center.latitude,
    geofence.center.longitude,
  );

  return distance <= geofence.radius;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(
  latitude: number,
  longitude: number,
  geofence: PolygonGeofence,
): boolean {
  const vertices = geofence.coordinates;
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].longitude;
    const yi = vertices[i].latitude;
    const xj = vertices[j].longitude;
    const yj = vertices[j].latitude;

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is inside any type of geofence
 */
export function isPointInGeofence(
  latitude: number,
  longitude: number,
  geofence: Geofence,
): boolean {
  if (geofence.type === 'circular') {
    return isPointInCircle(latitude, longitude, geofence);
  } else {
    return isPointInPolygon(latitude, longitude, geofence);
  }
}

/**
 * Get all geofences that contain a given point
 */
export function getContainingGeofences(
  latitude: number,
  longitude: number,
  geofences: Geofence[],
): Geofence[] {
  return geofences.filter((geofence) =>
    isPointInGeofence(latitude, longitude, geofence),
  );
}

/**
 * Calculate the center point of a polygon geofence
 */
export function getPolygonCenter(geofence: PolygonGeofence): {
  latitude: number;
  longitude: number;
} {
  const coords = geofence.coordinates;
  let latSum = 0;
  let lonSum = 0;

  coords.forEach((coord) => {
    latSum += coord.latitude;
    lonSum += coord.longitude;
  });

  return {
    latitude: latSum / coords.length,
    longitude: lonSum / coords.length,
  };
}

/**
 * Calculate minimum distance from a point to a geofence boundary
 */
export function distanceToGeofence(
  latitude: number,
  longitude: number,
  geofence: Geofence,
): number {
  if (geofence.type === 'circular') {
    const distance = calculateDistance(
      latitude,
      longitude,
      geofence.center.latitude,
      geofence.center.longitude,
    );
    return Math.abs(distance - geofence.radius);
  } else {
    // For polygon, calculate minimum distance to any edge
    const coords = geofence.coordinates;
    let minDistance = Infinity;

    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const distance = pointToLineSegmentDistance(
        latitude,
        longitude,
        coords[i].latitude,
        coords[i].longitude,
        coords[j].latitude,
        coords[j].longitude,
      );
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return calculateDistance(px, py, xx, yy);
}

/**
 * Validate geofence configuration
 */
export function validateGeofence(geofence: Geofence): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!geofence.id || !geofence.name) {
    errors.push('Geofence must have id and name');
  }

  if (geofence.type === 'circular') {
    if (geofence.radius <= 0) {
      errors.push('Circular geofence radius must be positive');
    }
    if (
      geofence.center.latitude < -90 ||
      geofence.center.latitude > 90 ||
      geofence.center.longitude < -180 ||
      geofence.center.longitude > 180
    ) {
      errors.push('Invalid center coordinates');
    }
  } else if (geofence.type === 'polygon') {
    if (geofence.coordinates.length < 3) {
      errors.push('Polygon must have at least 3 vertices');
    }
    for (const coord of geofence.coordinates) {
      if (
        coord.latitude < -90 ||
        coord.latitude > 90 ||
        coord.longitude < -180 ||
        coord.longitude > 180
      ) {
        errors.push('Invalid vertex coordinates');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
