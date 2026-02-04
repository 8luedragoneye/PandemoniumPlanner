/**
 * Name validation service
 * 
 * Validates player names against Albion Online guild membership.
 * Only players who are members of the configured guild can log in.
 */

import prisma from '../lib/prisma';
import { isGuildMember } from './albionApi';

/**
 * Validates a player name against Albion Online guild membership
 * @param name - The player name to validate
 * @returns Promise<boolean> - true if name is a guild member, false otherwise
 */
export async function validateName(name: string): Promise<boolean> {
  if (!name || name.trim().length === 0) {
    return false;
  }

  // Validate against Albion Online guild membership
  return await isGuildMember(name.trim());
}

/**
 * Finds a user by name (helper function)
 * Uses findFirst to work even if unique constraint isn't applied yet
 */
export async function findUserByName(name: string): Promise<User | null> {
  try {
    // Try findUnique first (if unique constraint exists)
    try {
      return await prisma.user.findUnique({
        where: { name: name.trim() },
      });
    } catch (error: unknown) {
      // If findUnique fails (constraint not applied), fall back to findFirst
      if (error instanceof Error && error.message?.includes('needs at least one of')) {
        return await prisma.user.findFirst({
          where: { name: name.trim() },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error finding user by name:', error);
    return null;
  }
}

