"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

// Fenetre d'essai : juillet 2026.
const MIN_DATE = "2026-07-01";
const MAX_DATE = "2026-07-31";

// loading : initial / anonymous : non connecte
// locked : connecte mais pas membre / ready : membre du Club
type Gate = "loading" | "anonymous" | "locked" | "ready";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TyreTestReservation({
  tyreSlug,
  tyreName,
}: {
  tyreSlug: string;
  tyreName: string;
}) {
  const [gate, setGate] = useState<Gate>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    let active = true;

    const load = async (u: User | null) => {
      if (!active) return;
      if (!u) {
        setUser(null);
        setGate("anonymous");
        return;
      }
      setUser(u);
      const { data: rider } = await supabase!
        .from("riders")
        .select("club_member")
        .eq("id", u.id)
        .maybeSingle();
      if (!active) return;
      if (!rider?.club_member) {
        setGate("locked");
        return;
      }
      setGate("ready");
      const { data: resa } = await supabase!
        .from("tyre_test_reservations")
        .select("test_date")
        .eq("rider_id", u.id)
        .eq("tyre_slug", tyreSlug)
        .maybeSingle();
      if (!active) return;
      if (resa?.test_date) {
        setBooked(resa.test_date);
        setDate(resa.test_date);
      }
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user ?? null));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [tyreSlug]);

  async function reserve() {
    if (!supabase || !user || !date) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("tyre_test_reservations").upsert(
      {
        rider_id: user.id,
        tyre_slug: tyreSlug,
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
    setBooked(date);
  }

  async function cancel() {
    if (!supabase || !user) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("tyre_test_reservations")
      .delete()
      .eq("rider_id", user.id)
      .eq("tyre_slug", tyreSlug);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBooked(null);
    setDate("");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-michelin-gray-line shadow-soft">
      <div className="relative overflow-hidden bg-michelin-navy p-7 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-michelin-blue/40 blur-3xl" />
        <span className="kicker">Programme Testeur</span>
        <h2 className="relative mt-3 text-2xl font-black">Réserve ton essai en avant-première</h2>
        <p className="relative mt-1 text-white/80">
          Les membres du Club testent le {tyreName} sur route avant tout le monde, en juillet 2026.
        </p>
      </div>

      <div className="bg-white p-7">{renderBody()}</div>
    </div>
  );

  function renderBody() {
    if (gate === "loading") {
      return <div className="h-20 animate-pulse rounded-2xl bg-michelin-gray-light" />;
    }

    if (gate === "anonymous") {
      return (
        <div className="text-center">
          <p className="text-michelin-ink">Connecte-toi pour réserver ton essai.</p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/">Se connecter</Link>
          </Button>
        </div>
      );
    }

    if (gate === "locked") {
      return (
        <div className="text-center">
          <p className="text-michelin-ink">
            L&apos;essai en avant-première est réservé aux membres du Club.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/club">Rejoindre le Club</Link>
          </Button>
        </div>
      );
    }

    // ready (membre)
    return (
      <div>
        {booked ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-michelin-green/10 p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-michelin-green text-sm font-bold text-white">
              &#10003;
            </span>
            <div>
              <div className="font-bold text-michelin-navy">Essai réservé</div>
              <div className="text-sm capitalize text-michelin-ink">{formatDate(booked)}</div>
            </div>
          </div>
        ) : null}

        <label className="block text-sm font-semibold text-michelin-ink">
          {booked ? "Changer la date d'essai" : "Choisis ta date d'essai (juillet 2026)"}
          <input
            type="date"
            min={MIN_DATE}
            max={MAX_DATE}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 block w-full rounded-pill border border-michelin-gray-line px-5 py-3 text-michelin-navy outline-none focus:border-michelin-blue"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" onClick={reserve} disabled={busy || !date || date === booked}>
            {busy ? "..." : booked ? "Modifier ma réservation" : "Réserver mon essai"}
          </Button>
          {booked ? (
            <Button size="lg" variant="outline" onClick={cancel} disabled={busy}>
              Annuler
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </div>
    );
  }
}
