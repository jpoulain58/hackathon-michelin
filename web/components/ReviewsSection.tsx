"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import type { ProductReview } from "@/lib/reviews";

type Gate = "loading" | "anonymous" | "ready";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-3 w-3" : "h-2 w-2";
  return (
    <span className="flex gap-1" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`${dim} rounded-full ${n <= rating ? "bg-michelin-blue" : "bg-michelin-gray-line"}`} />
      ))}
    </span>
  );
}

export function ReviewsSection({
  productId,
  productName,
  initialReviews,
}: {
  productId: number;
  productName: string;
  initialReviews: ProductReview[];
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [gate, setGate] = useState<Gate>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    let active = true;
    const load = (u: User | null) => {
      if (!active) return;
      setUser(u);
      setGate(u ? "ready" : "anonymous");
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user ?? null));
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function submit() {
    if (!supabase || !user || text.trim().length < 3) return;
    setBusy(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, rating, text }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Impossible d'enregistrer ton avis.");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-michelin-navy">Avis</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars rating={Math.round(average)} size="lg" />
            <span className="text-sm font-semibold text-michelin-ink">
              {average.toFixed(1)}/5 · {reviews.length} avis
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-michelin-ink/60">Aucun avis pour le moment, sois le premier à donner ton avis sur ce pneu.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-michelin-gray-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-michelin-navy">{r.riderName}</span>
                  {r.isAmbassador && (
                    <span className="rounded-pill bg-michelin-yellow/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-michelin-navy">
                      Ambassadeur
                    </span>
                  )}
                </div>
                <span className="text-xs text-michelin-ink/50">{formatDate(r.createdAt)}</span>
              </div>
              <div className="mt-1.5">
                <Stars rating={r.rating} />
              </div>
              <p className="mt-2 text-sm text-michelin-navy">&laquo; {r.text} &raquo;</p>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-michelin-gray-line bg-michelin-gray-light/40 p-5">
        {gate === "loading" && <div className="h-20 animate-pulse rounded-2xl bg-michelin-gray-light" />}

        {gate === "anonymous" && (
          <p className="text-sm text-michelin-ink">
            <Link href="/profil" className="font-semibold text-michelin-blue hover:underline">
              Connecte-toi
            </Link>{" "}
            pour laisser un avis sur le {productName}.
          </p>
        )}

        {gate === "ready" && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-michelin-navy">Laisser un avis sur le {productName}</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} étoiles`}
                  className={`h-7 w-7 rounded-full text-xs font-bold ${
                    n <= rating ? "bg-michelin-blue text-white" : "bg-white text-michelin-ink/40 ring-1 ring-michelin-gray-line"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ton expérience avec ce pneu..."
              rows={3}
              className="w-full rounded-2xl border border-michelin-gray-line px-4 py-3 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
            />
            <Button onClick={submit} disabled={busy || text.trim().length < 3}>
              {busy ? "..." : "Publier mon avis"}
            </Button>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
