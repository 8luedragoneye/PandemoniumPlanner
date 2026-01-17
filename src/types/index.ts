import { RecordModel } from 'pocketbase';

// Base types from PocketBase
export type User = RecordModel & {
  email: string;
  username: string;
  name: string;
};

export type Activity = RecordModel & {
  name: string;
  date: string; // ISO datetime string
  description: string;
  creator: string; // User ID
  status: 'recruiting' | 'full' | 'running';
  zone?: string;
  minIP?: number;
  minFame?: number;
  expand?: {
    creator?: User;
  };
};

export type Role = RecordModel & {
  activity: string; // Activity ID
  name: string;
  slots: number;
  attributes: Record<string, any>; // JSON object
  expand?: {
    activity?: Activity;
  };
};

export type Signup = RecordModel & {
  activity: string; // Activity ID
  role: string; // Role ID
  player: string; // User ID
  attributes: Record<string, any>; // JSON object (user's values)
  comment?: string;
  expand?: {
    activity?: Activity;
    role?: Role;
    player?: User;
  };
};

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
