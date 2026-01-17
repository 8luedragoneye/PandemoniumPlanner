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
  description: string;
  status: 'recruiting' | 'full' | 'running';
  zone: string | null;
  minIP: number | null;
  minFame: number | null;
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
