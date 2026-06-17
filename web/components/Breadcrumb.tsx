import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="border-b border-michelin-gray-line bg-white/80">
      <ol className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2.5 sm:px-6">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-michelin-gray-line" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-xs font-medium text-michelin-blue transition-colors hover:text-michelin-navy hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-michelin-navy" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
