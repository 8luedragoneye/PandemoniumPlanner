/**
 * Name validation service
 * 
 * This service validates player names. Currently checks if the name exists in the database.
 * To add external API validation, replace the validateName function with an API call.
 * 
 * Example external API implementation:
 * 
 * export async function validateName(name: string): Promise<boolean> {
 *   try {
 *     const response = await fetch(`https://external-api.com/validate/${name}`);
 *     const data = await response.json();
 *     return data.isValid === true;
 *   } catch (error) {
 *     console.error('External API validation error:', error);
 *     return false;
 *   }
 * }
 */

import prisma from '../lib/prisma';

/**
 * Validates a player name
 * @param name - The player name to validate
 * @returns Promise<boolean> - true if name is valid, false otherwise
 */
export async function validateName(name: string): Promise<boolean> {
  // Current implementation: Basic validation (always returns true)
  // To add external API validation, replace this function with an API call.
  // 
  // Example external API implementation:
  // try {
  //   const response = await fetch(`https://external-api.com/validate/${encodeURIComponent(name)}`);
  //   const data = await response.json();
  //   return data.isValid === true;
  // } catch (error) {
  //   console.error('External API validation error:', error);
  //   return false;
  // }
  
  if (!name || name.trim().length === 0) {
    return false;
  }

  // Basic validation: just check that name is not empty
  // External API validation can be added here later
  return true;
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

/**
 * Optional: Validate name with external API
 * Uncomment and implement when ready to use external validation
 */
// export async function validateNameWithExternalAPI(name: string): Promise<boolean> {
//   try {
//     const EXTERNAL_API_URL = process.env.EXTERNAL_VALIDATION_API_URL;
//     if (!EXTERNAL_API_URL) {
//       console.warn('External validation API URL not configured, falling back to database check');
//       return validateName(name);
//     }

//     const response = await fetch(`${EXTERNAL_API_URL}/validate/${encodeURIComponent(name)}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY || ''}`,
//       },
//     });

//     if (!response.ok) {
//       return false;
//     }

//     const data = await response.json();
//     return data.isValid === true || data.exists === true;
//   } catch (error) {
//     console.error('External API validation error:', error);
//     return false;
//   }
// }
