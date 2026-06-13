const PEER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const colorCache: Record<string, string> = {};

/**
 * Get a deterministic color for a user ID
 */
export function getPeerColor(userId: number): string {
  // if (!colorCache[userId]) {
  //     let hash = 0;
  //     for (let i = 0; i < userId.length; i++) {
  //         hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  //     }
  //     colorCache[userId] = PEER_COLORS[
  //         Math.abs(hash) % PEER_COLORS.length
  //     ] as string;
  // }
  // return colorCache[userId];
  return "none";
}
