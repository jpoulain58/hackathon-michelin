"use client";

export interface BaladeFormValues {
  name: string;
  description: string;
  instructions: string;
  terrain: string;
  landscape: string;
  difficulty: string;
  tags: string;
  tyre: string;
  tyreDesignation: string;
  tyreWeightG: string;
  tyreDimensions: string;
  proTipAuthor: string;
  proTipText: string;
}

export const EMPTY_BALADE_FORM: BaladeFormValues = {
  name: "",
  description: "",
  instructions: "",
  terrain: "Route",
  landscape: "",
  difficulty: "Intermédiaire",
  tags: "",
  tyre: "",
  tyreDesignation: "",
  tyreWeightG: "",
  tyreDimensions: "",
  proTipAuthor: "",
  proTipText: "",
};

export function baladeFormToPayload(values: BaladeFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    terrain: values.terrain,
    landscape: values.landscape.trim(),
    difficulty: values.difficulty,
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    tyre: values.tyre.trim(),
    tyreDetail: {
      name: values.tyre.trim(),
      designation: values.tyreDesignation.trim(),
      weightG: Number.parseInt(values.tyreWeightG, 10) || 0,
      dimensions: Number.parseInt(values.tyreDimensions, 10) || 0,
    },
    proTip: { author: values.proTipAuthor.trim(), text: values.proTipText.trim() },
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
  const set = <K extends keyof BaladeFormValues>(key: K, value: string) =>
    onChange({ ...values, [key]: value });

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
        <label className={labelClass}>Tags (séparés par des virgules)</label>
        <input
          className={inputClass}
          value={values.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="Panorama, Chrono, Grimpée"
        />
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

      <div className="rounded-xl border border-michelin-gray-line p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-michelin-ink/60">Pneu conseillé</p>
        <div className="space-y-2">
          <input
            className={inputClass}
            value={values.tyre}
            onChange={(e) => set("tyre", e.target.value)}
            placeholder="MICHELIN Power Cup"
          />
          <input
            className={inputClass}
            value={values.tyreDesignation}
            onChange={(e) => set("tyreDesignation", e.target.value)}
            placeholder="Competition Line"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputClass}
              type="number"
              value={values.tyreWeightG}
              onChange={(e) => set("tyreWeightG", e.target.value)}
              placeholder="Poids (g)"
            />
            <input
              className={inputClass}
              type="number"
              value={values.tyreDimensions}
              onChange={(e) => set("tyreDimensions", e.target.value)}
              placeholder="Dimensions dispo."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-michelin-gray-line p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-michelin-ink/60">Conseil du pro</p>
        <div className="space-y-2">
          <input
            className={inputClass}
            value={values.proTipAuthor}
            onChange={(e) => set("proTipAuthor", e.target.value)}
            placeholder="Auteur"
          />
          <textarea
            className={inputClass}
            rows={2}
            value={values.proTipText}
            onChange={(e) => set("proTipText", e.target.value)}
            placeholder="Conseil…"
          />
        </div>
      </div>
    </div>
  );
}
