import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = url && key ? createClient(url, key, {
  realtime: { params: { eventsPerSecond: 20 } },
}) : null;

export function getRaceChannel(roomId: string) {
  if (!supabase) return null;
  return supabase.channel(`race:${roomId}`, {
    config: { broadcast: { self: false }, presence: { key: "player_id" } },
  });
}
