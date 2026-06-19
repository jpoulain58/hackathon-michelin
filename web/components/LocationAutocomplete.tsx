"use client";

import { useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue";

export const DEFAULT_LOCATIONS = ["Pneu avant", "Pneu arriere"];

export function LocationAutocomplete({
  value,
  onChange,
  suggestions = DEFAULT_LOCATIONS,
  placeholder = "ex. Pneu avant",
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  // Tant que l'utilisateur n'a pas retape, on affiche toute la liste plutot
  // que de la filtrer sur la valeur deja pre-remplie (ex. "Pneu avant").
  const [typing, setTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const uniqueSuggestions = [...new Set(suggestions)];
  const options = typing
    ? uniqueSuggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : uniqueSuggestions;

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          setTyping(false);
          setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setTyping(true);
          setOpen(true);
        }}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-michelin-gray-line bg-white p-1 shadow-lift">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-michelin-navy hover:bg-michelin-gray-light"
                onClick={() => {
                  onChange(option);
                  setTyping(false);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
