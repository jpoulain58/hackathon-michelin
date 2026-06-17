import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export interface TagDefinition {
  key: string;
  label: string;
  icon: string;
}

export async function fetchTags(): Promise<TagDefinition[]> {
  const res = await fetch(`${API_BASE}/api/tags`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { items: TagDefinition[] };
  return data.items;
}

/** Charge les tags predefinis et expose un lookup key -> definition pour l'affichage. */
export function useTagDefinitions(): Map<string, TagDefinition> {
  const [tags, setTags] = useState<TagDefinition[]>([]);

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  return new Map(tags.map((tag) => [tag.key, tag]));
}
