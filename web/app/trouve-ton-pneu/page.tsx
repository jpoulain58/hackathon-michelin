"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreImage, tyreKind } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { fetchRecommendations, fetchStravaTyreProfile, type RecoView } from "@/lib/api";
import { QUESTIONS, answersToApiParams, getOptions, inferredToAnswers, type Answers } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

type Phase = "quiz" | "loading" | "results";

export default function TrouveTonPneu() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [results, setResults] = useState<RecoView[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [stravaPrefill, setStravaPrefill] = useState<{ basedOnRides: number } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetchStravaTyreProfile(token)
        .then((result) => {
          if (cancelled || !result) return;
          setAnswers((prev) => ({ ...inferredToAnswers(result.profile), ...prev }));
          setStravaPrefill({ basedOnRides: result.profile.basedOnRides });
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentQ = QUESTIONS[step - 1];
  const options = getOptions(currentQ, answers);
  const currentAnswer = answers[currentQ.id];
  const isLast = step === QUESTIONS.length;

  function handleSelect(questionId: number, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function clearStravaPrefill() {
    setStravaPrefill(null);
    setAnswers({});
    setStep(1);
  }

  async function handleNext() {
    if (!currentAnswer) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      const items = await fetchRecommendations(answersToApiParams(answers));
      setResults(items);
      if (items.length > 0) {
        setSelectedIds(new Set([tyreId(items[0])]));
      }
      setPhase("results");
    } catch {
      setError("Impossible de récupérer les recommandations. Réessaie dans un instant.");
      setPhase("quiz");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function restart() {
    setStep(1);
    setAnswers({});
    setPhase("quiz");
    setResults([]);
    setSelectedIds(new Set());
    setError(null);
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-6">
        {phase === "quiz" && (
          <QuizPhaseView
            step={step}
            currentQ={currentQ}
            options={options}
            currentAnswer={currentAnswer}
            isLast={isLast}
            error={error}
            stravaPrefill={stravaPrefill}
            onClearStravaPrefill={clearStravaPrefill}
            onSelect={handleSelect}
            onNext={handleNext}
            onBack={() => setStep((s) => s - 1)}
          />
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-michelin-gray-line border-t-michelin-blue" />
            <p className="text-lg font-bold text-michelin-navy">Recherche en cours…</p>
          </div>
        )}

        {phase === "results" && (
          <ResultsPhaseView
            results={results}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            onRestart={restart}
          />
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

// --- Sub-views ---------------------------------------------------------------

function QuizPhaseView({
  step,
  currentQ,
  options,
  currentAnswer,
  isLast,
  error,
  stravaPrefill,
  onClearStravaPrefill,
  onSelect,
  onNext,
  onBack,
}: {
  step: number;
  currentQ: (typeof QUESTIONS)[number];
  options: ReturnType<typeof getOptions>;
  currentAnswer: string | undefined;
  isLast: boolean;
  error: string | null;
  stravaPrefill: { basedOnRides: number } | null;
  onClearStravaPrefill: () => void;
  onSelect: (qId: number, optId: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      {stravaPrefill && step === 1 && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-[#FC5200]/10 p-4 text-sm">
          <p className="text-michelin-navy">
            <span className="font-bold">Pré-rempli depuis Strava</span> — déduit de tes{" "}
            {stravaPrefill.basedOnRides} dernières sorties vélo. Modifie les réponses si besoin.
          </p>
          <button
            type="button"
            onClick={onClearStravaPrefill}
            className="shrink-0 whitespace-nowrap font-semibold text-michelin-blue hover:underline"
          >
            Effacer
          </button>
        </div>
      )}

      {/* Progress */}
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemax={QUESTIONS.length}
        aria-label={`Question ${step} sur ${QUESTIONS.length}`}
      >
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i + 1 < step
                ? "bg-michelin-navy/40"
                : i + 1 === step
                  ? "bg-michelin-blue"
                  : "bg-michelin-gray-line",
            )}
          />
        ))}
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-michelin-ink">
        Question {step}/{QUESTIONS.length}
      </p>
      <h1 className="mt-1.5 text-2xl font-black leading-tight text-michelin-navy sm:text-3xl">
        {currentQ.question}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-michelin-ink">{currentQ.description}</p>

      {/* Options */}
      <div className="mt-6 flex flex-col gap-2.5">
        {options.map((opt) => {
          const active = currentAnswer === opt.id;
          return opt.photo ? (
            <ImageOptionCard
              key={opt.id}
              opt={opt}
              active={active}
              onPress={() => onSelect(currentQ.id, opt.id)}
            />
          ) : (
            <TextOptionCard
              key={opt.id}
              opt={opt}
              active={active}
              onPress={() => onSelect(currentQ.id, opt.id)}
            />
          );
        })}
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-michelin-gray-line bg-michelin-gray-light p-4 text-sm text-michelin-ink">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-2.5">
        <Button size="lg" className="w-full" onClick={onNext} disabled={!currentAnswer}>
          {isLast ? "Voir mes pneus" : "Question suivante"}
        </Button>
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-sm font-semibold text-michelin-ink transition-colors hover:text-michelin-blue"
          >
            ← Retour
          </button>
        )}
      </div>
    </>
  );
}

function ImageOptionCard({
  opt,
  active,
  onPress,
}: {
  opt: { id: string; label: string; photo?: string };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "relative h-[120px] w-full overflow-hidden rounded-2xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue",
        active ? "ring-[3px] ring-michelin-blue" : "ring-0 hover:ring-2 hover:ring-michelin-blue/40",
      )}
    >
      <img src={opt.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-michelin-navy/80 via-michelin-navy/20 to-transparent" />
      {active && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-michelin-blue text-sm font-bold text-white shadow">
          ✓
        </span>
      )}
      <span className="absolute bottom-0 left-0 right-0 p-4 text-base font-bold text-white drop-shadow">
        {opt.label}
      </span>
    </button>
  );
}

function TextOptionCard({
  opt,
  active,
  onPress,
}: {
  opt: { id: string; label: string; gamme?: string };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue",
        active
          ? "border-michelin-blue bg-michelin-blue text-white"
          : "border-michelin-gray-line bg-white text-michelin-navy hover:border-michelin-blue",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{opt.label}</span>
        {opt.gamme && (
          <span className={cn("text-xs font-medium", active ? "text-white/70" : "text-michelin-ink")}>
            Gamme {opt.gamme}
          </span>
        )}
      </div>
      <span
        className={cn(
          "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          active
            ? "border-white/50 bg-white/25 text-[10px] font-bold text-white"
            : "border-michelin-gray-line",
        )}
      >
        {active && "✓"}
      </span>
    </button>
  );
}

function ResultsPhaseView({
  results,
  selectedIds,
  onToggle,
  onRestart,
}: {
  results: RecoView[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onRestart: () => void;
}) {
  if (results.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-michelin-ink">
          Aucun résultat.{" "}
          <button onClick={onRestart} className="font-semibold text-michelin-blue hover:underline">
            Recommencer
          </button>
        </p>
      </div>
    );
  }

  const [featured, ...rest] = results;
  const featuredId = tyreId(featured);
  const featuredScore = Math.min(99, Math.max(1, featured.score));
  const compareHref = `/comparateur?ids=${encodeURIComponent([...selectedIds].join(","))}`;

  return (
    <>
      <h1 className="text-3xl font-black text-michelin-navy">Trouve ton pneu</h1>
      <p className="mt-1 text-sm text-michelin-ink">D&apos;après tes réponses</p>

      {/* Featured */}
      <button
        type="button"
        onClick={() => onToggle(featuredId)}
        className={cn(
          "mt-6 w-full rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          selectedIds.has(featuredId)
            ? "border-michelin-blue ring-2 ring-michelin-blue/20"
            : "border-michelin-blue",
        )}
      >
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-pill bg-michelin-green/10 px-3 py-1 text-xs font-bold text-michelin-green">
            {featuredScore}%
          </span>
          <span className="inline-flex items-center rounded-pill bg-michelin-navy px-3 py-1 text-xs font-bold text-michelin-yellow">
            Meilleur choix
          </span>
        </div>
        <div className="my-5 flex justify-center">
          <TyreImage kind={tyreKind(featured)} className="h-32 w-32" />
        </div>
        <p className="text-center text-base font-bold text-michelin-navy">
          {featured.range} {featured.designation}
        </p>
        {featured.weightG && (
          <p className="mt-1 text-center text-sm text-michelin-ink">{featured.weightG} g</p>
        )}
      </button>

      {/* List */}
      {rest.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {rest.map((t) => {
            const id = tyreId(t);
            const active = selectedIds.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue",
                  active
                    ? "border-michelin-blue bg-[#EAF0F9]"
                    : "border-michelin-gray-line bg-white hover:border-michelin-blue",
                )}
              >
                <TyreImage kind={tyreKind(t)} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-michelin-navy">
                    {t.range} {t.designation}
                  </p>
                  {t.weightG && (
                    <p className="text-xs text-michelin-ink">{t.weightG} g</p>
                  )}
                </div>
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    active ? "border-michelin-blue bg-michelin-blue" : "border-michelin-gray-line",
                  )}
                >
                  {active && <span className="text-[10px] font-bold text-white">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2.5">
        {selectedIds.size >= 2 ? (
          <Button asChild size="lg" className="w-full">
            <Link href={compareHref}>Comparer la sélection ({selectedIds.size})</Link>
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled>
            Comparer la sélection ({selectedIds.size})
          </Button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-2 text-sm font-semibold text-michelin-ink transition-colors hover:text-michelin-blue"
        >
          Recommencer le questionnaire
        </button>
      </div>
    </>
  );
}

function tyreId(t: RecoView): string {
  return String(t.id);
}
