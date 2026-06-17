"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { BaladeFormFields, EMPTY_BALADE_FORM, baladeFormToPayload, type BaladeFormValues } from "@/components/BaladeFormFields";

export function AddBaladeFromStravaButton({
  accessToken,
  activityId,
  activityName,
}: {
  accessToken: string;
  activityId: string;
  activityName: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<BaladeFormValues>({ ...EMPTY_BALADE_FORM, name: activityName });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
    setCreatedId(null);
    setValues({ ...EMPTY_BALADE_FORM, name: activityName });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/rides/from-strava`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ activityId, ...baladeFormToPayload(values) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `API ${res.status}`);
      }
      const ride = (await res.json()) as { id: string };
      setCreatedId(ride.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création de la balade impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Ajouter comme balade
      </Button>

      <Modal open={open} onClose={close} title="Publier cette sortie comme balade">
        {createdId ? (
          <div className="space-y-3 text-sm text-michelin-ink">
            <p className="font-semibold text-michelin-navy">Balade publiée avec succès !</p>
            <Link href={`/balades/${createdId}`} className="font-semibold text-michelin-blue hover:underline">
              Voir la balade →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <BaladeFormFields values={values} onChange={setValues} />
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button type="button" className="w-full" disabled={submitting || !values.name.trim()} onClick={submit}>
              {submitting ? "Création..." : "Publier la balade"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
