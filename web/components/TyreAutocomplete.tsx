"use client";

import { useEffect, useRef, useState } from "react";
import { searchProducts, formatProductLabel, type ProductOption } from "@/lib/products";

const inputClass =
  "w-full rounded-xl border border-michelin-gray-line bg-white px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue";

export function TyreAutocomplete({
  value,
  onSelect,
  placeholder = "Rechercher un pneu MICHELIN…",
}: {
  value: ProductOption | null;
  onSelect: (product: ProductOption | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ? formatProductLabel(value) : "");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value ? formatProductLabel(value) : "");
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      searchProducts(query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClass}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onSelect(null);
        }}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-michelin-gray-line bg-white p-1 shadow-lift">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-michelin-navy hover:bg-michelin-gray-light"
                onClick={() => {
                  onSelect(product);
                  setQuery(formatProductLabel(product));
                  setOpen(false);
                }}
              >
                {formatProductLabel(product)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
