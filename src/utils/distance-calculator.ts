/**
 * location-monitor - Distance Calculator
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Utilities for calculating distances and geographic measurements
 */

const EARTH_RADIUS_M = 6371000;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Calculate bearing (heading) between two coordinates
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Calculate speed based on distance and time
 * @param distanceMeters Distance in meters
 * @param timeMs Time in milliseconds
 * @returns Speed in km/h
 */
export function calculateSpeed(distanceMeters: number, timeMs: number): number {
  if (timeMs === 0) return 0;
  
  const distanceKm = distanceMeters / 1000;
  const timeHours = timeMs / (1000 * 60 * 60);
  
  return distanceKm / timeHours;
}

/**
 * Validate if coordinates are within valid ranges
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Detect if movement distance is abnormally large (potential GPS error)
 */
export function isAbnormalJump(
  distanceMeters: number,
  timeMs: number,
  maxJumpDistance: number,
): boolean {
  // If time is very small, allow larger distances
  if (timeMs < 1000) return false;
  
  return distanceMeters > maxJumpDistance;
}

/**
 * Calculate destination point given distance and bearing
 */
export function calculateDestination(
  lat: number,
  lon: number,
  distanceMeters: number,
  bearing: number,
): { latitude: number; longitude: number } {
  const angularDistance = distanceMeters / EARTH_RADIUS_M;
  const bearingRad = toRadians(bearing);
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);

  const lat2 = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad),
  );

  const lon2 =
    lonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2),
    );

  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lon2),
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
