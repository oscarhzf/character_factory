import { CharacterDetailClient } from "./character-detail-client";

export default async function CharacterDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CharacterDetailClient id={id} />;
}
