"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";

interface Props {
  userId?: string;
}

export function ClubReferral({ userId }: Props) {
  const [referralUrl, setReferralUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      setReferralUrl(`${window.location.origin}/club?ref=${userId}`);
    }
  }, [userId]);

  function copy() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function share() {
    if (!referralUrl) return;
    if (navigator.share) {
      navigator.share({
        title: "Rejoins le Club Trust Wheels",
        text: "Je suis membre du Club Trust Wheels Michelin — rejoins-moi et profite des avantages exclusifs !",
        url: referralUrl,
      });
    } else {
      copy();
    }
  }

  if (!userId) return null;

  return (
    <section className="border-t border-michelin-gray-line">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Parrainage</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Invite tes amis
        </Reveal>
        <Reveal as="p" delay={120} className="mt-2 max-w-2xl text-michelin-ink">
          Partage ton lien unique. Quand un ami rejoint le Club via ton lien, tu débloque le badge
          <strong className="text-michelin-navy"> Recruteur</strong>.
        </Reveal>

        {/* Lien de parrainage */}
        <Reveal delay={160}>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft sm:flex-row sm:items-center">
            <input
              readOnly
              value={referralUrl}
              className="flex-1 rounded-xl border border-michelin-gray-line bg-michelin-gray-light px-4 py-2.5 text-sm font-mono text-michelin-navy outline-none"
              onFocus={(e) => e.target.select()}
            />
            <div className="flex shrink-0 gap-2">
              <button
                onClick={copy}
                className="rounded-pill bg-michelin-yellow px-4 py-2.5 text-sm font-bold text-michelin-navy transition-[filter] hover:brightness-95"
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
              <button
                onClick={share}
                className="rounded-pill bg-michelin-navy px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
              >
                Partager
              </button>
            </div>
          </div>
        </Reveal>

        {/* Comment ça marche */}
        <Reveal delay={200}>
          <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {[
              { n: "1", t: "Tu partages ton lien", d: "Envoie-le par message, sur Strava ou sur les réseaux." },
              { n: "2", t: "Ton ami découvre le Club", d: "Il arrive directement sur la page d'invitation avec ton nom affiché." },
              { n: "3", t: "Il rejoint — tu gagnes", d: "Badge Recruteur débloqué sur ton profil dès la confirmation." },
            ].map((step) => (
              <li key={step.n} className="flex flex-1 gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-michelin-blue text-sm font-black text-white">
                  {step.n}
                </span>
                <div>
                  <p className="font-bold text-michelin-navy">{step.t}</p>
                  <p className="mt-0.5 text-sm text-michelin-ink">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
