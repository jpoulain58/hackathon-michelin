"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { BaladeFormFields, EMPTY_BALADE_FORM, baladeFormToPayload, type BaladeFormValues } from "@/components/BaladeFormFields";
import { supabase } from "@/lib/supabase/client";

export function AddBaladeGpxButton({ onCreated }: { onCreated: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [values, setValues] = useState<BaladeFormValues>(EMPTY_BALADE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  function close() {
    setOpen(false);
    setError(null);
    setGpxFile(null);
    setValues(EMPTY_BALADE_FORM);
  }

  async function submit() {
    if (!session || !gpxFile) return;
    setSubmitting(true);
    setError(null);
    try {
      const gpxXml = await gpxFile.text();
      const res = await fetch(`${API_BASE}/api/rides/from-gpx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ gpxXml, ...baladeFormToPayload(values) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `API ${res.status}`);
      }
      onCreated();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création de la balade impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Ajouter une balade (GPX)
      </Button>

      <Modal open={open} onClose={close} title="Ajouter une balade depuis un fichier GPX">
        {!session ? (
          <p className="text-sm text-michelin-ink">Connecte-toi pour partager une balade.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-michelin-ink">Fichier GPX</label>
              <input
                type="file"
                accept=".gpx"
                onChange={(e) => setGpxFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-michelin-ink"
              />
            </div>
            <BaladeFormFields values={values} onChange={setValues} />
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button
              type="button"
              className="w-full"
              disabled={submitting || !gpxFile || !values.name.trim()}
              onClick={submit}
            >
              {submitting ? "Création..." : "Publier la balade"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
