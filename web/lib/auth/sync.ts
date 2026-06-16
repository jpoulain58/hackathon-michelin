import type { Session } from "@supabase/supabase-js";
import { API_BASE } from "@/lib/api";

export async function syncRider(session: Session | null): Promise<void> {
  if (!session?.access_token) return;

  const response = await fetch(`${API_BASE}/api/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Sync auth API ${response.status}`);
  }
}
