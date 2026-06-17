import { fetchRide } from "@/lib/balades";
import { notFound } from "next/navigation";
import { BaladeDetail } from "./BaladeDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ride = await fetchRide(id);
  if (!ride) notFound();
  return <BaladeDetail ride={ride} />;
}
