import { JourneyPlayer } from "@/components/journey-player";
export default async function Journey({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return <JourneyPlayer id={id} resume={query.resume === "1"} />;
}
