/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ClubMembership } from "@/components/ClubMembership";
import { ClubChallenges } from "@/components/ClubChallenges";
import { ClubEvents } from "@/components/ClubEvents";
import { Garage } from "@/components/Garage";
import { ClubTesterProgram } from "@/components/ClubTesterProgram";
import { supabase } from "@/lib/supabase/client";

type MemberState = "loading" | "anonymous" | "guest" | "member";

const PROGRAMME = [
  {
    titre: "Recois en avant-premiere",
    desc: "Les nouveaux pneus Michelin t'arrivent avant leur sortie publique, livres chez toi.",
  },
  {
    titre: "Teste sur la route",
    desc: "Pas un labo : ton terrain, ta meteo, tes kilometres. La preuve par la route, pour de vrai.",
  },
  {
    titre: "Partage ta preuve",
    desc: "Ton avis guide la communaute et nourrit la R&D Michelin.",
  },
];

const INVITE_FEATURES = [
  {
    num: "01",
    title: "Mon Garage connecte",
    desc: "Suis l'usure de chaque pneu en temps reel. Saisis tes km ou sync Strava pour savoir exactement quand changer.",
  },
  {
    num: "02",
    title: "Programme Testeur",
    desc: "Recois les nouveaux pneus Michelin avant leur sortie et donne ton avis officiel a la R&D.",
  },
  {
    num: "03",
    title: "Avantages exclusifs",
    desc: "2 pneus offerts par an, 10 % de reduction chez nos revendeurs partenaires, badge Testeur sur ton profil.",
  },
];

export default function Club() {
  const [memberState, setMemberState] = useState<MemberState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setMemberState("anonymous");
      return;
    }
    let active = true;

    const load = async (sessionUser: User | null) => {
      if (!active) return;
      if (!sessionUser) {
        setUser(null);
        setMemberState("anonymous");
        return;
      }
      setUser(sessionUser);
      const { data } = await supabase!
        .from("riders")
        .select("club_member")
        .eq("id", sessionUser.id)
        .maybeSingle();
      if (!active) return;
      setMemberState(data?.club_member ? "member" : "guest");
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) =>
      load(session?.user ?? null),
    );

    const onMembershipChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ member: boolean }>).detail;
      setMemberState(detail.member ? "member" : "guest");
    };
    window.addEventListener("club-membership-changed", onMembershipChanged);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("club-membership-changed", onMembershipChanged);
    };
  }, []);

  const isMember = memberState === "member";
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Rider";

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {isMember ? <MemberBanner displayName={displayName} /> : <InviteHero loading={memberState === "loading"} />}

      <ProgrammeTesteurSection />
      <ClubEvents />

      {isMember ? <MemberBody userId={user?.id} /> : <InviteBody />}

      <SiteFooter />
    </main>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Section commune : Programme Testeur (visible par tous)    */
/* ────────────────────────────────────────────────────────── */

function ProgrammeTesteurSection() {
  return (
    <section className="tread-pattern border-t border-michelin-gray-line bg-michelin-gray-light">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Exclusif membres</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Le Programme Testeur Michelin
        </Reveal>
        <Reveal as="p" delay={120} className="mt-2 max-w-2xl text-michelin-ink">
          Les membres du Club deviennent les testeurs officiels des nouveaux pneus. Tu roules,
          tu partages, Michelin ecoute.
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROGRAMME.map((p, i) => (
            <Reveal
              as="article"
              key={p.titre}
              delay={i * 80}
              className="rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft card-interactive"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-michelin-blue text-sm font-black text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold text-michelin-navy">{p.titre}</h3>
              <p className="mt-2 text-sm text-michelin-ink">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page invitation (non-membre)                              */
/* ────────────────────────────────────────────────────────── */

function InviteHero({ loading }: { loading: boolean }) {
  return (
    <section className="relative overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <img src="/photos/city-rider.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-veil" />
      </div>
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Le Club</span>
        </Reveal>
        <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Club Trust Wheels
        </Reveal>
        <Reveal as="p" delay={120} className="mt-3 max-w-xl text-lg text-white/85">
          La fidelite vient apres la preuve. Roule, teste, et fais partie de ceux qui font
          avancer Michelin.
        </Reveal>
        {!loading && (
          <Reveal delay={180}>
            <a
              href="#rejoindre"
              className="mt-8 inline-flex items-center gap-2 rounded-pill bg-michelin-yellow px-6 py-3 text-sm font-black text-michelin-navy transition-[filter] hover:brightness-95"
            >
              Rejoindre le Club
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function InviteBody() {
  return (
    <>
      {/* 3 avantages phares */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Reveal as="h2" className="text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Ce qui est inclus dans le Club
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {INVITE_FEATURES.map((f, i) => (
            <Reveal
              key={f.num}
              as="article"
              delay={i * 80}
              className="rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft card-interactive"
            >
              <span className="text-3xl font-black text-michelin-blue/20">{f.num}</span>
              <h3 className="mt-3 font-bold text-michelin-navy">{f.title}</h3>
              <p className="mt-2 text-sm text-michelin-ink">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Carte adhesion */}
      <section id="rejoindre" className="mx-auto max-w-3xl px-6 pb-16">
        <ClubMembership />
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page membre                                               */
/* ────────────────────────────────────────────────────────── */

function MemberBanner({ displayName }: { displayName: string }) {
  return (
    <section className="relative overflow-hidden bg-michelin-navy text-white">
      <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-michelin-blue/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-michelin-yellow/10 blur-3xl" />
      <div className="mx-auto max-w-5xl px-6 pb-12 pt-32">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-pill bg-michelin-green/20 px-3 py-1 text-xs font-bold text-michelin-green ring-1 ring-michelin-green/40">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-michelin-green" />
            Membre actif
          </span>
        </div>
        <Reveal as="h1" delay={60} className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          Bonjour, {displayName}
        </Reveal>
        <Reveal as="p" delay={120} className="mt-2 text-white/70">
          Bienvenue dans ton espace Club Trust Wheels.
        </Reveal>
      </div>
    </section>
  );
}

function MemberBody({ userId }: { userId?: string }) {
  return (
    <>
      {/* Mon Garage */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Inclus dans le Club</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Mon Garage connecte
        </Reveal>
        <Reveal as="p" delay={120} className="mt-2 text-michelin-ink">
          Suis l&apos;usure de tes pneus en temps reel. Saisis tes km a la main ou synchronise
          directement depuis Strava.
        </Reveal>
        <div className="mt-8">
          <Garage />
        </div>
      </section>

      {/* Défis & badges */}
      <ClubChallenges userId={userId} />

      {/* Extras membres */}
      <section className="border-t border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Reveal as="h2" className="text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
            Tes autres avantages membres
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {MEMBER_EXTRAS.map((f, i) => (
              <Reveal key={f.href} delay={i * 80}>
                <Link
                  href={f.href}
                  className="group flex h-full flex-col rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="font-bold text-michelin-navy">{f.label}</h3>
                  <p className="mt-2 flex-1 text-sm text-michelin-ink">{f.desc}</p>
                  <span
                    className={`mt-5 inline-block self-start rounded-pill px-3 py-1.5 text-xs font-bold transition-[filter] group-hover:brightness-95 ${f.accent}`}
                  >
                    {f.cta}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Programme Testeur */}
      <section className="tread-pattern border-t border-michelin-gray-line">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Exclusif membres</span>
          </Reveal>
          <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
            Le Programme Testeur Michelin
          </Reveal>
          <Reveal as="p" delay={120} className="mt-2 max-w-2xl text-michelin-ink">
            Réserve ta date d&apos;essai pour les prochains pneus Michelin : tu les reçois en
            avant-première, tu roules, tu donnes ton avis officiel à la R&amp;D.
          </Reveal>
          <ClubTesterProgram userId={userId} />
        </div>
      </section>

      {/* Gestion adhesion (quitter le club) */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <details className="group rounded-2xl border border-michelin-gray-line bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-michelin-ink/60 group-open:text-michelin-navy">
            Gerer mon adhesion
          </summary>
          <div className="mt-4">
            <ClubMembership />
          </div>
        </details>
      </section>
    </>
  );
}
