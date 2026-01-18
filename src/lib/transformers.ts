// Transform API responses to frontend types
import type { Activity, Role, Signup, User } from '../types';
import type { ApiActivity, ApiRole, ApiSignup, ApiUser } from './apiTypes';

export function transformUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    name: apiUser.name,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
}

export function transformActivity(apiActivity: ApiActivity): Activity {
  return {
    id: apiActivity.id,
    name: apiActivity.name,
    date: apiActivity.date,
    massupTime: apiActivity.massupTime ?? undefined,
    description: apiActivity.description,
    creator: apiActivity.creatorId,
    status: apiActivity.status,
    zone: apiActivity.zone ?? undefined,
    minEquip: apiActivity.minEquip ?? undefined,
    created: apiActivity.createdAt,
    updated: apiActivity.updatedAt,
    expand: apiActivity.creator ? {
      creator: transformUser(apiActivity.creator),
    } : undefined,
  };
}

export function transformRole(apiRole: ApiRole): Role {
  let attributes: Record<string, unknown> = {};
  try {
    attributes = typeof apiRole.attributes === 'string' 
      ? JSON.parse(apiRole.attributes) 
      : apiRole.attributes;
  } catch {
    attributes = {};
  }

  return {
    id: apiRole.id,
    activity: apiRole.activityId,
    name: apiRole.name,
    slots: apiRole.slots,
    attributes,
    created: apiRole.createdAt,
    updated: apiRole.updatedAt,
  };
}

export function transformSignup(apiSignup: ApiSignup): Signup {
  let attributes: Record<string, unknown> = {};
  try {
    attributes = typeof apiSignup.attributes === 'string'
      ? JSON.parse(apiSignup.attributes)
      : apiSignup.attributes;
  } catch {
    attributes = {};
  }

  return {
    id: apiSignup.id,
    activity: apiSignup.activityId,
    role: apiSignup.roleId,
    player: apiSignup.playerId,
    attributes,
    comment: apiSignup.comment ?? undefined,
    created: apiSignup.createdAt,
    updated: apiSignup.updatedAt,
    expand: {
      activity: apiSignup.activity ? transformActivity(apiSignup.activity as unknown as ApiActivity) : undefined,
      role: apiSignup.role ? {
        id: apiSignup.role.id,
        activity: apiSignup.activityId,
        name: apiSignup.role.name,
        slots: apiSignup.role.slots,
        attributes: {},
        created: '',
        updated: '',
      } : undefined,
      player: apiSignup.player ? transformUser(apiSignup.player) : undefined,
    },
  };
}
