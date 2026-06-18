"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { fetchProductsList, submitReview, type ProductOption } from "@/lib/api";

type Gate = "loading" | "anonymous" | "ready";

export function CommunityReviewForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState<Gate>("loading");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    let active = true;
    const load = (u: User | null) => {
      if (active) setGate(u ? "ready" : "anonymous");
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

  useEffect(() => {
    if (open && products.length === 0) {
      fetchProductsList()
        .then((items) => {
          setProducts(items);
          setProductId(items[0]?.id ?? null);
        })
        .catch(() => {});
    }
  }, [open, products.length]);

  async function submit() {
    if (!supabase || !productId || text.trim().length < 3) return;
    setBusy(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      return;
    }
    try {
      await submitReview(token, { productId, rating, text });
      setText("");
      setOpen(false);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer ton avis.");
    } finally {
      setBusy(false);
    }
  }

  if (gate === "loading") return null;

  if (gate === "anonymous") {
    return (
      <div className="rounded-2xl border border-michelin-gray-line bg-michelin-gray-light/40 p-5 text-sm text-michelin-ink">
        <Link href="/profil" className="font-semibold text-michelin-blue hover:underline">
          Connecte-toi
        </Link>{" "}
        pour laisser un avis sur un pneu.
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="lg" onClick={() => setOpen(true)}>
        Laisser un avis
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-michelin-gray-line bg-michelin-gray-light/40 p-5">
      <p className="text-sm font-bold text-michelin-navy">Laisser un avis</p>

      <label className="mt-3 block text-sm font-semibold text-michelin-ink">
        Pneu
        <select
          value={productId ?? ""}
          onChange={(e) => setProductId(Number(e.target.value))}
          className="mt-1.5 block w-full rounded-pill border border-michelin-gray-line bg-white px-4 py-2.5 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center gap-2">
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
        className="mt-3 w-full rounded-2xl border border-michelin-gray-line px-4 py-3 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <Button onClick={submit} disabled={busy || !productId || text.trim().length < 3}>
          {busy ? "..." : "Publier mon avis"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Annuler
        </Button>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
