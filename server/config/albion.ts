/**
 * Albion Online API Configuration
 * 
 * All values can be configured via environment variables.
 * Defaults are provided for development.
 */

export const albionConfig = {
  // API base URL
  // Options: 'ams' (Amsterdam), 'sgp' (Singapore), 'was' (Washington)
  apiBaseUrl: process.env.ALBION_API_URL || 'https://gameinfo-ams.albiononline.com/api/gameinfo',

  // Guild name to validate members against
  guildName: process.env.ALBION_GUILD_NAME || 'Pandemonium',

  // Include all guilds in the same alliance (default: false)
  includeAlliance: process.env.ALBION_INCLUDE_ALLIANCE === 'true',

  // Cache duration in milliseconds (default: 5 minutes)
  cacheDurationMs: parseInt(process.env.ALBION_CACHE_DURATION_MS || '300000', 10),

  // Request timeout in milliseconds (default: 10 seconds)
  requestTimeoutMs: parseInt(process.env.ALBION_REQUEST_TIMEOUT_MS || '10000', 10),
};
