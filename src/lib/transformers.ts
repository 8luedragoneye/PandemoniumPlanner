// Transform API responses to frontend types
import type { Activity, Role, Signup, User, TransportPair, FillProvider, FillAssignment } from '../types';
import type { ApiActivity, ApiRole, ApiSignup, ApiUser, ApiTransportPair, ApiFillProvider, ApiFillAssignment } from './apiTypes';

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
  // Parse activityTypes JSON string to array
  let activityTypes: string[] = [];
  if (apiActivity.activityTypes) {
    try {
      const parsed = JSON.parse(apiActivity.activityTypes);
      if (Array.isArray(parsed)) {
        activityTypes = parsed;
      }
    } catch {
      activityTypes = [];
    }
  }

  return {
    id: apiActivity.id,
    name: apiActivity.name,
    date: apiActivity.date,
    massupTime: apiActivity.massupTime ?? undefined,
    description: apiActivity.description,
    creator: apiActivity.creatorId,
    status: apiActivity.status,
    type: (apiActivity.type === 'transport' || apiActivity.type === 'regular') ? apiActivity.type : undefined,
    activityTypes,
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

export function transformPair(apiPair: ApiTransportPair): TransportPair {
  return {
    id: apiPair.id,
    activity: apiPair.activityId,
    fighter: apiPair.fighterId,
    transporter: apiPair.transporterId,
    created: apiPair.createdAt,
    updated: apiPair.updatedAt,
    expand: {
      fighter: apiPair.fighter ? {
        id: apiPair.fighter.id,
        activity: apiPair.activityId,
        role: apiPair.fighter.role?.id || '',
        player: apiPair.fighter.player?.id || '',
        attributes: apiPair.fighter.attributes,
        comment: undefined,
        created: '',
        updated: '',
        expand: {
          player: apiPair.fighter.player ? transformUser(apiPair.fighter.player) : undefined,
          role: apiPair.fighter.role ? {
            id: apiPair.fighter.role.id,
            activity: apiPair.activityId,
            name: apiPair.fighter.role.name,
            slots: 0,
            attributes: {},
            created: '',
            updated: '',
          } : undefined,
        },
      } : undefined,
      transporter: apiPair.transporter ? {
        id: apiPair.transporter.id,
        activity: apiPair.activityId,
        role: apiPair.transporter.role?.id || '',
        player: apiPair.transporter.player?.id || '',
        attributes: apiPair.transporter.attributes,
        comment: undefined,
        created: '',
        updated: '',
        expand: {
          player: apiPair.transporter.player ? transformUser(apiPair.transporter.player) : undefined,
          role: apiPair.transporter.role ? {
            id: apiPair.transporter.role.id,
            activity: apiPair.activityId,
            name: apiPair.transporter.role.name,
            slots: 0,
            attributes: {},
            created: '',
            updated: '',
          } : undefined,
        },
      } : undefined,
    },
  };
}

export function transformFillProvider(apiProvider: ApiFillProvider): FillProvider {
  return {
    id: apiProvider.id,
    userId: apiProvider.userId,
    providesSlots: apiProvider.providesSlots,
    providesWeight: apiProvider.providesWeight,
    slotOrigin: apiProvider.slotOrigin ?? undefined,
    slotTarget: apiProvider.slotTarget ?? undefined,
    weightOrigin: apiProvider.weightOrigin ?? undefined,
    weightTarget: apiProvider.weightTarget ?? undefined,
    isActive: apiProvider.isActive,
    notes: apiProvider.notes ?? undefined,
    priority: apiProvider.priority,
    user: apiProvider.user ? {
      id: apiProvider.user.id,
      name: apiProvider.user.name,
      email: apiProvider.user.email
    } : undefined,
    created: apiProvider.createdAt,
    updated: apiProvider.updatedAt,
  };
}

export function transformFillAssignment(apiAssignment: ApiFillAssignment): FillAssignment {
  return {
    id: apiAssignment.id,
    activity: apiAssignment.activityId,
    pair: apiAssignment.pairId,
    provider: apiAssignment.providerId,
    fillType: apiAssignment.fillType,
    created: apiAssignment.createdAt,
    updated: apiAssignment.updatedAt,
    expand: {
      activity: undefined, // Can be populated if needed
      pair: apiAssignment.pair ? transformPair(apiAssignment.pair) : undefined,
      provider: apiAssignment.provider ? transformFillProvider(apiAssignment.provider) : undefined,
    },
  };
}
