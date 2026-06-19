"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { getEvenement, type Evenement } from "@/lib/evenements";
import { supabase } from "@/lib/supabase/client";

type Gate = "loading" | "anonymous" | "locked" | "ready";

export default function EvenementPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const event = getEvenement(id);

  if (!event) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="text-2xl font-black text-michelin-navy">Évènement introuvable</h1>
          <p className="mt-2 text-michelin-ink">Cet évènement n&apos;existe pas ou plus.</p>
          <Button asChild className="mt-6">
            <Link href="/club">Retour au Club</Link>
          </Button>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Breadcrumb items={[{ label: "Club", href: "/club" }, { label: event.title }]} />

      {/* En-tete */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Reveal as="span" className="inline-block">
          <span className="chip">{event.badge}</span>
        </Reveal>
        <Reveal as="h1" delay={60} className="mt-4 text-3xl font-black tracking-tight text-michelin-navy sm:text-4xl">
          {event.title}
        </Reveal>
        <Reveal as="p" delay={120} className="mt-3 text-lg font-bold text-michelin-blue">
          🏆 {event.reward}
        </Reveal>
        <Reveal as="p" delay={160} className="mt-1 text-sm font-medium text-michelin-ink/60">
          {event.dateRange}
        </Reveal>
        <Reveal as="p" delay={200} className="mt-6 text-michelin-ink">
          {event.description}
        </Reveal>

        <Reveal delay={240} className="mt-8 rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft">
          <h2 className="font-bold text-michelin-navy">Reglement</h2>
          <ul className="mt-3 space-y-2 text-sm text-michelin-ink">
            {event.rules.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 text-michelin-blue">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <MemberGatedSection event={event} />

      <SiteFooter />
    </main>
  );
}

function MemberGatedSection({ event }: { event: Evenement }) {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    let active = true;

    const resolve = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      const uid = next?.user.id;
      if (!uid) {
        setGate("anonymous");
        return;
      }
      const { data } = await supabase!
        .from("riders")
        .select("club_member")
        .eq("id", uid)
        .maybeSingle();
      if (!active) return;
      setGate(data?.club_member ? "ready" : "locked");
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => resolve(next));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (gate === "loading") {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="h-32 animate-pulse rounded-2xl bg-michelin-gray-light" />
      </section>
    );
  }

  if (gate !== "ready") {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-michelin-gray-line bg-white p-8 text-center shadow-soft">
          <div className="pointer-events-none absolute inset-0 tread-pattern opacity-60" />
          <div className="relative">
            <span className="flex mx-auto h-12 w-12 items-center justify-center rounded-pill bg-michelin-navy text-white">
              <LockGlyph />
            </span>
            <h3 className="mt-4 text-xl font-black text-michelin-navy">
              {event.member.type === "leaderboard" ? "Classement reserve aux membres" : "Tickets reserves aux membres"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-michelin-ink">
              Rejoins le Club Trust Wheels pour voir le classement en direct et participer aux
              recompenses.
            </p>
            {gate === "anonymous" ? (
              <Button asChild size="lg" className="mt-6">
                <Link href="/">Connecte-toi</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="mt-6">
                <Link href="/club#rejoindre">Rejoindre le Club</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pb-16">
      <div className="rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft">
        {event.member.type === "leaderboard" ? (
          <>
            <h2 className="font-bold text-michelin-navy">Classement</h2>
            <ul className="mt-4 space-y-2">
              {event.member.entries.map((entry) => (
                <li
                  key={entry.rank}
                  className="flex items-center justify-between rounded-xl border border-michelin-gray-line px-4 py-2.5"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-michelin-blue text-xs font-black text-white">
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                    </span>
                    <span className="font-semibold text-michelin-navy">{entry.name}</span>
                  </span>
                  <span className="text-sm font-bold text-michelin-ink">{entry.km} km</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="font-bold text-michelin-navy">Tes tickets de participation</h2>
            <p className="mt-4 text-3xl font-black text-michelin-blue">
              {event.member.ticketsIssued.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs font-medium text-michelin-ink/60">tickets emis au total</p>
            <p className="mt-4 text-sm text-michelin-ink">{event.member.note}</p>
          </>
        )}
      </div>
    </section>
  );
}

function LockGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
