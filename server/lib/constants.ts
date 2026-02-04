// Server-side constants

export const JWT_EXPIRATION = '7d';

export const DEFAULT_JWT_SECRET = 'your-secret-key-change-in-production';

// Cleanup activities that are past by this many hours
export const ACTIVITY_CLEANUP_HOURS = 2;

// Activity types for categorization/filtering
export const ACTIVITY_TYPES = [
  'Hardcore Expeditions',
  'Roads of Avalon',
  'Arena',
  'Hellgates',
  'World Boss',
  'Static Dungeons',
  'Blue Police',
  'Faction Warfare',
  'Golden Chests',
  'Ganking',
  'PvE',
  'PvP',
  'Transport',
  'Gathering',
  'Scent Trails',
  'Camps',
  'Group Dungeons',
  'Castles & Keeps',
  'Black Zone Spiders',
  'Abyssal Depths',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
