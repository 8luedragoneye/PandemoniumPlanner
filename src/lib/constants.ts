// Application constants
// Avoid magic numbers/strings throughout the codebase

export const DEFAULT_ACTIVITY_DURATION_HOURS = 2;

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

// Helper to get category for an activity type
export function getActivityCategory(type: string): 'PvE' | 'PvP' | 'Mixed' | null {
  if (ACTIVITY_TYPE_CATEGORIES['PvE Activities'].includes(type as any)) return 'PvE';
  if (ACTIVITY_TYPE_CATEGORIES['PvP Activities'].includes(type as any)) return 'PvP';
  if (ACTIVITY_TYPE_CATEGORIES['Mixed (PvE & PvP)'].includes(type as any)) return 'Mixed';
  return null;
}

// Get auto-assigned meta tags based on selected activity types
export function getAutoAssignedMetaTags(selectedTypes: string[]): string[] {
  const metaTags: Set<string> = new Set();
  
  for (const type of selectedTypes) {
    const category = getActivityCategory(type);
    if (category === 'PvE') {
      metaTags.add('PvE');
    } else if (category === 'PvP') {
      metaTags.add('PvP');
    } else if (category === 'Mixed') {
      metaTags.add('PvE');
      metaTags.add('PvP');
    }
  }
  
  return Array.from(metaTags);
}

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
