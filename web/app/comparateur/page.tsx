import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ComparateurClient } from "./ComparateurClient";

export default function ComparateurPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-michelin-gray-line border-t-michelin-blue" />
          </div>
        }
      >
        <ComparateurClient />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
