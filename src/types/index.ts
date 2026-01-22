// Base types matching Prisma schema
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  date: string; // ISO datetime string
  massupTime?: string | null; // ISO datetime string
  description: string;
  creator: string; // User ID (creatorId from backend)
  status: 'recruiting' | 'full' | 'running';
  type?: 'regular' | 'transport';
  zone?: string | null;
  minEquip?: string | null; // T4, T5, T6, T7, T8, T9, T10, T11
  created: string; // createdAt
  updated: string; // updatedAt
  expand?: {
    creator?: User;
  };
}

export interface Role {
  id: string;
  activity: string; // Activity ID (activityId from backend)
  name: string;
  slots: number;
  attributes: Record<string, unknown>; // JSON object
  created: string; // createdAt
  updated: string; // updatedAt
  expand?: {
    activity?: Activity;
  };
}

export interface Signup {
  id: string;
  activity: string; // Activity ID (activityId from backend)
  role: string; // Role ID (roleId from backend)
  player: string; // User ID (playerId from backend)
  attributes: Record<string, unknown>; // JSON object (user's values)
  comment?: string | null;
  created: string; // createdAt
  updated: string; // updatedAt
  expand?: {
    activity?: Activity;
    role?: Role;
    player?: User;
  };
}

// Form types
export interface ActivityFormData {
  name: string;
  date: string;
  massupTime?: string;
  description: string;
  zone?: string;
  minEquip?: string; // T4, T5, T6, T7, T8, T9, T10, T11
}

export interface RoleFormData {
  name: string;
  slots: number;
  attributes: Record<string, unknown>;
}

export interface SignupFormData {
  roleId: string;
  attributes: Record<string, unknown>;
  comment?: string;
}

export interface TransportPair {
  id: string;
  activity: string; // Activity ID
  fighter: string; // Signup ID
  transporter: string; // Signup ID
  created: string;
  updated: string;
  expand?: {
    activity?: Activity;
    fighter?: Signup;
    transporter?: Signup;
  };
}

export interface TransportSignupAttributes {
  role: 'Fighter' | 'Transporter';
  weaponType?: string; // For Fighters
  source: string;
  target: string;
  preferredPartner?: string;
  gearNeeds?: string;
  slots?: number;
  gewicht?: number;
  returnTransport?: {
    slots: number;
    weight: number;
    source: string;
    target: string;
  };
  carleonTransport?: {
    source?: string;
    target?: string;
    slots?: number;
    gewicht?: number;
  };
}

export interface FillProvider {
  id: string;
  userId: string;
  providesSlots: boolean;
  providesWeight: boolean;
  slotOrigin?: string | null;
  slotTarget?: string | null;
  weightOrigin?: string | null;
  weightTarget?: string | null;
  isActive: boolean;
  notes?: string | null;
  priority?: number; // Calculated from points
  user?: {
    id: string;
    name: string;
    email: string;
  };
  created: string;
  updated: string;
}

export interface FillAssignment {
  id: string;
  activity: string; // Activity ID
  pair: string; // TransportPair ID
  provider: string; // FillProvider ID
  fillType: 'slots' | 'weight';
  created: string;
  updated: string;
  expand?: {
    activity?: Activity;
    pair?: TransportPair;
    provider?: FillProvider;
  };
}

export interface FillProviderPoints {
  id: string;
  provider: string; // FillProvider ID
  activity?: string | null; // Activity ID
  points: number;
  reason: string;
  notes?: string | null;
  created: string;
}
