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
  description: string;
  creator: string; // User ID (creatorId from backend)
  status: 'recruiting' | 'full' | 'running';
  zone?: string | null;
  minIP?: number | null;
  minFame?: number | null;
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
  description: string;
  zone?: string;
  minIP?: number;
  minFame?: number;
}

export interface RoleFormData {
  name: string;
  slots: number;
  attributes: Record<string, any>;
}

export interface SignupFormData {
  roleId: string;
  attributes: Record<string, any>;
  comment?: string;
}
