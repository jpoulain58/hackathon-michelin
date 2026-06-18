"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type CountUpProps = {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

/**
 * Anime un nombre de 0 a `value` quand il entre dans le viewport (meme
 * pattern IntersectionObserver que Reveal). Respecte prefers-reduced-motion
 * en affichant directement la valeur finale.
 */
export function CountUp({ value, suffix = "", duration = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={cn(className)}>
      {display.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}
