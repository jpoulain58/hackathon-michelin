import { notFound } from "next/navigation";
import { fetchPro, FALLBACK_PROS, type ProRider } from "@/lib/api";
import { ProDetail } from "./ProDetail";

async function loadPro(slug: string): Promise<ProRider | null> {
  try {
    const pro = await fetchPro(slug);
    if (pro) return pro;
  } catch {
    // API indisponible : on retombe sur les donnees de demo.
  }
  return FALLBACK_PROS.find((p) => p.slug === slug) ?? null;
}

export default async function ProPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pro = await loadPro(slug);
  if (!pro) notFound();
  return <ProDetail pro={pro} />;
}
