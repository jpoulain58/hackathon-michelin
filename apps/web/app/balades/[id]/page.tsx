import { RIDES } from "@/lib/balades";
import { notFound } from "next/navigation";
import { BaladeDetail } from "./BaladeDetail";

export function generateStaticParams() {
  return RIDES.map((r) => ({ id: r.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ride = RIDES.find((r) => r.id === id);
  if (!ride) notFound();
  return <BaladeDetail ride={ride} />;
}
