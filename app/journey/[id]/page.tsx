import { JourneyPlayer } from "@/components/journey-player";
export default async function Journey({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JourneyPlayer id={id} />;
}
