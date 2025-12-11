/**
 * location-monitor - Time Utilities
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Time-related utility functions
 */

/**
 * Get current timestamp in milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Check if a timestamp is older than a given duration
 */
export function isOlderThan(timestamp: number, durationMs: number): boolean {
  return now() - timestamp > durationMs;
}

/**
 * Check if a timestamp is within a given duration from now
 */
export function isWithin(timestamp: number, durationMs: number): boolean {
  return now() - timestamp <= durationMs;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Parse duration string to milliseconds
 * Supports formats like: "30s", "5m", "2h", "1d"
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get time ago string
 */
export function timeAgo(timestamp: number): string {
  const ms = now() - timestamp;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Check if timestamp is valid
 */
export function isValidTimestamp(timestamp: number): boolean {
  return (
    !isNaN(timestamp) &&
    timestamp > 0 &&
    timestamp <= now() + 60000 // Allow 1 minute in the future
  );
}

/**
 * Get start of day timestamp
 */
export function startOfDay(timestamp: number = now()): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp
 */
export function endOfDay(timestamp: number = now()): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}
