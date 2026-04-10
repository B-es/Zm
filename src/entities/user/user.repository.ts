import { supabase } from "@/supabase";

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
}

const nicknameCache = new Map<string, string>();

/**
 * Get user nickname by ID (with caching)
 */
export async function getUserNickname(userId: string): Promise<string> {
  if (nicknameCache.has(userId)) {
    return nicknameCache.get(userId)!;
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("nickname")
      .eq("id", userId)
      .single();

    if (error) return userId;

    const nickname = data?.nickname || userId;
    nicknameCache.set(userId, nickname);
    return nickname;
  } catch {
    return userId;
  }
}

/**
 * Get multiple user nicknames at once
 */
export async function getUserNicknames(userIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Check cache first
  const uncached = userIds.filter((id) => !nicknameCache.has(id));

  if (uncached.length > 0) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, nickname")
        .in("id", uncached);

      if (!error && data) {
        for (const profile of data) {
          nicknameCache.set(profile.id, profile.nickname || profile.id);
          result.set(profile.id, profile.nickname || profile.id);
        }
      }
    } catch {
      // Silently fail, will return userIds as fallback
    }
  }

  // Fill from cache
  for (const id of userIds) {
    result.set(id, nicknameCache.get(id) || id);
  }

  return result;
}

/**
 * Upsert user's profile
 */
export async function upsertUser(
  userId: string,
  nickname: string,
  avatarUrl = ""
): Promise<void> {
  try {
    const { error } = await supabase.rpc("upsert_user_profile", {
      p_user_id: userId,
      p_nickname: nickname,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      // If the function doesn't exist, silently ignore (migration not run yet)
      if (error.code === "42883") {
        return;
      }
      // Silently fail for other errors too
      return;
    }
  } catch {
    // Completely silent - user profile will be created later
  }
}

/**
 * Clear nickname cache (e.g., on logout)
 */
export function clearNicknameCache(): void {
  nicknameCache.clear();
}
