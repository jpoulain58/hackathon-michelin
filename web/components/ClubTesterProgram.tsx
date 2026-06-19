"use client";

import { useEffect, useState } from "react";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase/client";

// Pneus a tester en avant-premiere (Programme Testeur du Club).
type TestTyre = {
  slug: string;
  name: string;
  teaser: string;
  monthLabel: string;
  min: string;
  max: string;
};

const TEST_TYRES: TestTyre[] = [
  {
    slug: "power-pulse",
    name: "MICHELIN Power Pulse",
    teaser: "Le pneu route le plus rapide jamais conçu par Michelin.",
    monthLabel: "Juillet 2026",
    min: "2026-07-01",
    max: "2026-07-31",
  },
  {
    slug: "power-gravel-rs-evo",
    name: "MICHELIN Power Gravel RS EVO",
    teaser: "Le gravel race nouvelle génération, pensé pour les bikepackers rapides.",
    monthLabel: "Août 2026",
    min: "2026-08-01",
    max: "2026-08-31",
  },
  {
    slug: "city-endure",
    name: "MICHELIN City Endure",
    teaser: "L'increvable du quotidien urbain : protection maximale, zéro compromis.",
    monthLabel: "Septembre 2026",
    min: "2026-09-01",
    max: "2026-09-30",
  },
];

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ClubTesterProgram({ userId }: { userId?: string }) {
  const [booked, setBooked] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    let alive = true;
    supabase
      .from("tyre_test_reservations")
      .select("tyre_slug, test_date")
      .eq("rider_id", userId)
      .in(
        "tyre_slug",
        TEST_TYRES.map((t) => t.slug),
      )
      .then(({ data }) => {
        if (!alive) return;
        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          map[(row as { tyre_slug: string }).tyre_slug] = (row as { test_date: string }).test_date;
        }
        setBooked(map);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  function handleChange(slug: string, date: string | null) {
    setBooked((prev) => {
      const next = { ...prev };
      if (date) next[slug] = date;
      else delete next[slug];
      return next;
    });
  }

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {TEST_TYRES.map((tyre) => (
        <TesterCard
          key={tyre.slug}
          tyre={tyre}
          userId={userId}
          bookedDate={booked[tyre.slug] ?? null}
          loading={loading}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}

function TesterCard({
  tyre,
  userId,
  bookedDate,
  loading,
  onChange,
}: {
  tyre: TestTyre;
  userId?: string;
  bookedDate: string | null;
  loading: boolean;
  onChange: (slug: string, date: string | null) => void;
}) {
  const [date, setDate] = useState(bookedDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDate(bookedDate ?? "");
  }, [bookedDate]);

  async function reserve() {
    if (!supabase || !userId || !date) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("tyre_test_reservations").upsert(
      {
        rider_id: userId,
        tyre_slug: tyre.slug,
        test_date: date,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "rider_id,tyre_slug" },
    );
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChange(tyre.slug, date);
  }

  async function cancel() {
    if (!supabase || !userId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("tyre_test_reservations")
      .delete()
      .eq("rider_id", userId)
      .eq("tyre_slug", tyre.slug);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChange(tyre.slug, null);
    setDate("");
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft">
      <span className="inline-flex w-fit rounded-pill bg-michelin-yellow px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-michelin-navy">
        {tyre.monthLabel}
      </span>
      <h3 className="mt-3 font-black text-michelin-navy">{tyre.name}</h3>
      <p className="mt-1 flex-1 text-sm text-michelin-ink">{tyre.teaser}</p>

      {loading ? (
        <div className="mt-4 h-10 animate-pulse rounded-xl bg-michelin-gray-light" />
      ) : bookedDate ? (
        <div className="mt-4">
          <div className="flex items-start gap-2 rounded-xl bg-michelin-green/10 p-3">
            <CheckCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-michelin-green" />
            <div>
              <div className="text-xs font-black text-michelin-navy">Essai réservé</div>
              <div className="text-xs capitalize text-michelin-ink">{formatDate(bookedDate)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="mt-2 text-xs font-bold text-[#C0341D] transition-opacity hover:underline disabled:opacity-60"
          >
            Annuler ma réservation
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-michelin-ink">
            Choisis ta date d&apos;essai
            <input
              type="date"
              min={tyre.min}
              max={tyre.max}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-michelin-gray-line px-3 py-2 text-sm font-semibold text-michelin-navy outline-none focus:border-michelin-blue"
            />
          </label>
          <button
            type="button"
            onClick={reserve}
            disabled={busy || !date}
            className="w-full rounded-pill bg-michelin-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-michelin-blue disabled:opacity-60"
          >
            {busy ? "..." : "Réserver mon essai"}
          </button>
        </div>
      )}

      {error ? <p className="mt-2 text-xs font-medium text-[#C0341D]">{error}</p> : null}
    </article>
  );
}
