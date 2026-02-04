// Type definitions for API responses
// These match the Prisma schema structure

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  name: string;
  date: string;
  massupTime: string | null;
  description: string;
  status: 'recruiting' | 'full' | 'running';
  type: string | null; // regular, transport
  activityTypes: string | null; // JSON array string of activity type tags
  zone: string | null;
  minEquip: string | null; // T4, T5, T6, T7, T8, T9, T10, T11
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: ApiUser;
}

export interface ApiRole {
  id: string;
  activityId: string;
  name: string;
  slots: number;
  attributes: string; // JSON string from Prisma
  createdAt: string;
  updatedAt: string;
  activity?: {
    id: string;
    creatorId: string;
  };
}

export interface ApiSignup {
  id: string;
  activityId: string;
  roleId: string;
  playerId: string;
  attributes: string; // JSON string from Prisma
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  activity?: {
    id: string;
    name: string;
    creatorId: string;
  };
  role?: {
    id: string;
    name: string;
    slots: number;
  };
  player?: ApiUser;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

export interface ApiError {
  error: string;
}

export interface ApiTransportPair {
  id: string;
  activityId: string;
  fighterId: string;
  transporterId: string;
  createdAt: string;
  updatedAt: string;
  fighter?: {
    id: string;
    attributes: Record<string, unknown>;
    player?: ApiUser;
    role?: {
      id: string;
      name: string;
    };
  };
  transporter?: {
    id: string;
    attributes: Record<string, unknown>;
    player?: ApiUser;
    role?: {
      id: string;
      name: string;
    };
  };
}

export interface ApiFillProvider {
  id: string;
  userId: string;
  providesSlots: boolean;
  providesWeight: boolean;
  slotOrigin: string | null;
  slotTarget: string | null;
  weightOrigin: string | null;
  weightTarget: string | null;
  isActive: boolean;
  notes: string | null;
  priority?: number;
  createdAt: string;
  updatedAt: string;
  user?: ApiUser;
  points?: Array<{
    id: string;
    points: number;
    reason: string;
    activityId: string | null;
    createdAt: string;
  }>;
}

export interface ApiFillAssignment {
  id: string;
  activityId: string;
  pairId: string;
  providerId: string;
  fillType: 'slots' | 'weight';
  createdAt: string;
  updatedAt: string;
  provider?: ApiFillProvider;
  pair?: ApiTransportPair;
}

export interface ApiPremadeRole {
  id: string;
  premadeActivityId: string;
  name: string;
  slots: number;
  attributes: Record<string, unknown>; // Parsed JSON object
  createdAt: string;
  updatedAt: string;
}

export interface ApiPremadeActivity {
  id: string;
  name: string;
  description: string;
  type: string | null; // regular, transport
  zone: string | null;
  minEquip: string | null; // T4, T5, T6, T7, T8, T9, T10, T11
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: ApiUser;
  roles?: ApiPremadeRole[];
}
