import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProfileClient } from "./ProfileClient";

export default function ProfilPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <ProfileClient />
      <SiteFooter />
    </main>
  );
}
