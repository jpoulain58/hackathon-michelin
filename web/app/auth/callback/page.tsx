import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-michelin-navy px-6 text-white">
      <div className="w-full max-w-sm space-y-5">
        <Brand />
        <div className="h-1 w-16 bg-michelin-yellow" />
        <h1 className="text-2xl font-bold">Connexion en cours</h1>
        <Suspense fallback={<p className="text-sm font-medium text-white/85">Chargement...</p>}>
          <AuthCallbackClient />
        </Suspense>
      </div>
    </main>
  );
}
