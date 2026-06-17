import { Suspense } from "react";
import { UpdatePasswordClient } from "./UpdatePasswordClient";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-michelin-navy px-6 py-10">
      <div className="w-full max-w-md rounded-[1.5rem] bg-white p-5 text-michelin-navy shadow-glow">
        <h1 className="text-2xl font-black">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm font-medium text-michelin-ink">
          Choisis un mot de passe pour retrouver ton compte.
        </p>
        <Suspense fallback={<p className="mt-5 text-sm font-semibold">Chargement...</p>}>
          <UpdatePasswordClient />
        </Suspense>
      </div>
    </main>
  );
}
