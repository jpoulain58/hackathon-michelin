"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children?: ReactNode;
  /** Element rendu (div par defaut). */
  as?: ElementType;
  /** Delai d'entree en ms (pour staggers : delay={i * 60}). */
  delay?: number;
  className?: string;
};

/**
 * Revele son contenu (fade + translate vers le haut) quand il entre dans le
 * viewport, via IntersectionObserver. Sans dependance, anime en CSS (transform
 * + opacity uniquement -> GPU). `prefers-reduced-motion` est gere globalement
 * dans globals.css ; l'attribut data-reveal sert aussi de filet no-JS.
 */
export function Reveal({ children, as, delay = 0, className }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out-strong will-change-transform motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
