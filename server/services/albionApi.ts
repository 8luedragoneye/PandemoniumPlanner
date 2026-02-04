/**
 * Albion Online API Service
 * 
 * Validates player names against guild (or alliance) membership using the Albion Online public API.
 * Includes caching to avoid excessive API calls.
 */

import { albionConfig } from '../config/albion';

// Types for API responses
interface GuildSearchResult {
  Id: string;
  Name: string;
  AllianceId: string;
  AllianceName: string;
}

interface GuildMember {
  Id: string;
  Name: string;
  GuildId: string;
  GuildName: string;
}

interface SearchResponse {
  guilds: GuildSearchResult[];
}

interface AllianceGuild {
  Id: string;
  Name: string;
}

// In-memory cache
let memberCache: {
  names: Set<string>;
  guildId: string | null;
  allianceId: string | null;
  guildIds: string[];
  lastFetch: number;
} = {
  names: new Set(),
  guildId: null,
  allianceId: null,
  guildIds: [],
  lastFetch: 0,
};

/**
 * Search for a guild by name and return its ID and AllianceId
 */
async function getGuildInfo(guildName: string): Promise<{ guildId: string; allianceId: string | null } | null> {
  const url = `${albionConfig.apiBaseUrl}/search?q=${encodeURIComponent(guildName)}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(albionConfig.requestTimeoutMs),
    });

    if (!response.ok) {
      console.error(`Albion API error: ${response.status}`);
      return null;
    }

    const data: SearchResponse = await response.json();

    // Find exact match (case-insensitive)
    const guild = data.guilds?.find(
      (g) => g.Name.toLowerCase() === guildName.toLowerCase()
    );

    if (!guild) {
      return null;
    }

    return {
      guildId: guild.Id,
      allianceId: guild.AllianceId || null,
    };
  } catch (error) {
    console.error('Failed to fetch guild info:', error);
    return null;
  }
}

/**
 * Get all guilds in an alliance
 */
async function getAllianceGuilds(allianceId: string): Promise<string[]> {
  const url = `${albionConfig.apiBaseUrl}/alliances/${allianceId}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(albionConfig.requestTimeoutMs),
    });

    if (!response.ok) {
      console.error(`Albion API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // The alliance endpoint returns Guilds array (capital G)
    const guilds: AllianceGuild[] = data.Guilds || [];
    return guilds.map((g) => g.Id);
  } catch (error) {
    console.error('Failed to fetch alliance guilds:', error);
    return [];
  }
}

/**
 * Get all member names for a guild
 */
async function getGuildMembers(guildId: string): Promise<string[]> {
  const url = `${albionConfig.apiBaseUrl}/guilds/${guildId}/members`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(albionConfig.requestTimeoutMs),
    });

    if (!response.ok) {
      console.error(`Albion API error: ${response.status}`);
      return [];
    }

    const members: GuildMember[] = await response.json();
    return members.map((m) => m.Name);
  } catch (error) {
    console.error('Failed to fetch guild members:', error);
    return [];
  }
}

/**
 * Refresh the member cache if stale
 */
async function refreshCacheIfNeeded(): Promise<boolean> {
  const now = Date.now();
  const cacheAge = now - memberCache.lastFetch;

  // Cache is still fresh
  if (cacheAge < albionConfig.cacheDurationMs && memberCache.names.size > 0) {
    return true;
  }

  try {
    // Get guild info (cache it too)
    if (!memberCache.guildId) {
      const guildInfo = await getGuildInfo(albionConfig.guildName);
      if (!guildInfo) {
        console.error(`Guild "${albionConfig.guildName}" not found`);
        return false;
      }
      memberCache.guildId = guildInfo.guildId;
      memberCache.allianceId = guildInfo.allianceId;
    }

    // Determine which guilds to fetch members from
    let guildIds: string[] = [memberCache.guildId];

    if (albionConfig.includeAlliance && memberCache.allianceId) {
      // Get all guilds in the alliance
      const allianceGuildIds = await getAllianceGuilds(memberCache.allianceId);
      if (allianceGuildIds.length > 0) {
        guildIds = allianceGuildIds;
        console.log(`Found ${guildIds.length} guilds in alliance`);
      }
    }

    memberCache.guildIds = guildIds;

    // Get members from all guilds
    const allMemberNames: string[] = [];
    for (const guildId of guildIds) {
      const members = await getGuildMembers(guildId);
      allMemberNames.push(...members);
    }

    if (allMemberNames.length === 0) {
      console.error('No members returned from API');
      // Keep existing cache if we have one
      return memberCache.names.size > 0;
    }

    // Update cache (lowercase for case-insensitive comparison)
    memberCache.names = new Set(allMemberNames.map((n) => n.toLowerCase()));
    memberCache.lastFetch = now;

    const mode = albionConfig.includeAlliance ? 'alliance' : 'guild';
    console.log(`Refreshed ${mode} cache: ${memberCache.names.size} members from ${guildIds.length} guild(s)`);
    return true;
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    // Keep existing cache if we have one
    return memberCache.names.size > 0;
  }
}

/**
 * Check if a player name is a guild member
 */
export async function isGuildMember(playerName: string): Promise<boolean> {
  const cacheValid = await refreshCacheIfNeeded();

  if (!cacheValid) {
    // If cache refresh failed and we have no cached data, deny access (fail secure)
    return false;
  }

  return memberCache.names.has(playerName.toLowerCase());
}

/**
 * Force refresh the cache (useful for admin endpoint)
 */
export async function forceRefreshCache(): Promise<{ success: boolean; memberCount: number; guildCount: number }> {
  // Reset cache to force full refresh
  memberCache.lastFetch = 0;
  memberCache.guildId = null;
  memberCache.allianceId = null;
  memberCache.guildIds = [];
  
  const success = await refreshCacheIfNeeded();
  return { success, memberCount: memberCache.names.size, guildCount: memberCache.guildIds.length };
}

/**
 * Get cache status (useful for debugging)
 */
export function getCacheStatus() {
  return {
    memberCount: memberCache.names.size,
    guildId: memberCache.guildId,
    guildName: albionConfig.guildName,
    allianceId: memberCache.allianceId,
    includeAlliance: albionConfig.includeAlliance,
    guildCount: memberCache.guildIds.length,
    lastFetch: memberCache.lastFetch ? new Date(memberCache.lastFetch).toISOString() : null,
    cacheAgeMs: memberCache.lastFetch ? Date.now() - memberCache.lastFetch : null,
    cacheDurationMs: albionConfig.cacheDurationMs,
  };
}
