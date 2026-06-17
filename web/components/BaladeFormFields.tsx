"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fetchTags, type TagDefinition } from "@/lib/tags";
import { getTagIcon } from "@/lib/tag-icons";
import { type ProductOption } from "@/lib/products";
import { TyreAutocomplete } from "@/components/TyreAutocomplete";
import { cn } from "@/lib/utils";

export interface BaladeFormValues {
  name: string;
  description: string;
  instructions: string;
  terrain: string;
  landscape: string;
  difficulty: string;
  tags: string[];
  usedTyre: ProductOption | null;
  usedTyreRating: number | null;
}

export const EMPTY_BALADE_FORM: BaladeFormValues = {
  name: "",
  description: "",
  instructions: "",
  terrain: "Route",
  landscape: "",
  difficulty: "Intermédiaire",
  tags: [],
  usedTyre: null,
  usedTyreRating: null,
};

export function baladeFormToPayload(values: BaladeFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    terrain: values.terrain,
    landscape: values.landscape.trim(),
    difficulty: values.difficulty,
    tags: values.tags,
    usedTyreProductId: values.usedTyre?.id,
    usedTyreRating: values.usedTyre ? values.usedTyreRating ?? undefined : undefined,
  };
}

const inputClass =
  "w-full rounded-xl border border-michelin-gray-line bg-white px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue";
const labelClass = "mb-1 block text-xs font-bold text-michelin-ink";

export function BaladeFormFields({
  values,
  onChange,
}: {
  values: BaladeFormValues;
  onChange: (values: BaladeFormValues) => void;
}) {
  const [availableTags, setAvailableTags] = useState<TagDefinition[]>([]);

  useEffect(() => {
    fetchTags()
      .then(setAvailableTags)
      .catch(() => setAvailableTags([]));
  }, []);

  const set = <K extends keyof BaladeFormValues>(key: K, value: BaladeFormValues[K]) =>
    onChange({ ...values, [key]: value });

  function toggleTag(key: string) {
    set("tags", values.tags.includes(key) ? values.tags.filter((t) => t !== key) : [...values.tags, key]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Nom de la balade</label>
        <input
          className={inputClass}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Boucle des Crêtes"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Terrain</label>
          <select className={inputClass} value={values.terrain} onChange={(e) => set("terrain", e.target.value)}>
            <option value="Route">Route</option>
            <option value="Gravel">Gravel</option>
            <option value="VTT">VTT</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Difficulté</label>
          <select
            className={inputClass}
            value={values.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
          >
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Paysage</label>
        <input
          className={inputClass}
          value={values.landscape}
          onChange={(e) => set("landscape", e.target.value)}
          placeholder="Montagne, Forêt, Plateau…"
        />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const Icon = getTagIcon(tag.icon);
            const active = values.tags.includes(tag.key);
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => toggleTag(tag.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-michelin-blue bg-michelin-blue text-white"
                    : "border-michelin-gray-line bg-white text-michelin-ink hover:border-michelin-blue",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-michelin-gray-line p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-michelin-ink/60">Pneu utilisé</p>
        <div className="space-y-2">
          <TyreAutocomplete
            value={values.usedTyre}
            onSelect={(product) => onChange({ ...values, usedTyre: product, usedTyreRating: product ? values.usedTyreRating : null })}
          />
          {values.usedTyre && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Noter ${n} sur 5`}
                  onClick={() => set("usedTyreRating", n)}
                  className="p-0.5 text-michelin-yellow"
                >
                  <Star className="h-5 w-5" fill={values.usedTyreRating != null && n <= values.usedTyreRating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Instructions au départ</label>
        <textarea
          className={inputClass}
          rows={2}
          value={values.instructions}
          onChange={(e) => set("instructions", e.target.value)}
        />
      </div>
    </div>
  );
}
