// Application constants
// Avoid magic numbers/strings throughout the codebase

export const DEFAULT_ACTIVITY_DURATION_HOURS = 2;

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

export const JWT_EXPIRATION = '7d';

export const TIMEZONE_CET = 'Europe/Berlin';

// Fill Provider constants
export const MIN_FILL_SLOTS = 100;
export const MIN_FILL_WEIGHT = 20; // tons
export const MAX_FILL_ASSIGNMENTS_PER_PROVIDER = 2;

// UI constants
export const DEBOUNCE_DELAY_MS = 100;
export const TEXTAREA_MIN_HEIGHT = 80;
