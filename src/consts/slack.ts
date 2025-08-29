// Team to Slack user ID mappings
export const teamToSlackMap = {
  team_5: 'U6BDMEER0',
  team_9: 'U6DCHN9K2',
  team_11: 'U6KNBPYLE',
  team_13: 'U6CACS3GW',
  team_16: 'U07RYKRC7UP',
  team_20: 'U6AT12XSM',
  team_27: 'U060JASDCMC',
} as const;

// Get all valid Slack user IDs
export const validSlackUserIds = Object.values(teamToSlackMap);

// Helper function to check if a user ID is authorized
export function isAuthorizedUser(userId: string): boolean {
  return validSlackUserIds.includes(
    userId as (typeof validSlackUserIds)[number]
  );
}
