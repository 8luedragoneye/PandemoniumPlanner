// Server-side constants

export const JWT_EXPIRATION = '7d';

export const DEFAULT_JWT_SECRET = 'your-secret-key-change-in-production';

// Cleanup activities that are past by this many hours
export const ACTIVITY_CLEANUP_HOURS = 2;

// Activity types organized by category
export const ACTIVITY_TYPE_CATEGORIES = {
  'PvE Activities': [
    'HCE',
    'Static Dungeons',
    'Group Dungeons',
    'World Boss',
    'Camps',
    'Abyssal Depths',
    'Black Zone Spiders',
    'Gathering',
    'Scent Trails',
  ],
  'PvP Activities': [
    'Arena',
    'Hellgates',
    'Ganking',
    'Faction Warfare',
    'Blue Police',
  ],
  'Mixed (PvE & PvP)': [
    'Roads of Avalon',
    'Castles & Keeps',
    'Golden Chests',
    'Transport',
  ],
} as const;

// Flat list of all activity types (excluding PvE/PvP meta tags)
export const ACTIVITY_TYPES = [
  ...ACTIVITY_TYPE_CATEGORIES['PvE Activities'],
  ...ACTIVITY_TYPE_CATEGORIES['PvP Activities'],
  ...ACTIVITY_TYPE_CATEGORIES['Mixed (PvE & PvP)'],
] as const;

// Meta tags that are auto-assigned
export const META_TAGS = ['PvE', 'PvP'] as const;

// All valid tags (activity types + meta tags)
export const ALL_VALID_TAGS = [...ACTIVITY_TYPES, ...META_TAGS] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
