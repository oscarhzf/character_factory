import { JobCreateClient } from "./job-create-client";

export default async function NewJobPage({
  searchParams
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId } = await searchParams;

  return <JobCreateClient preferredCharacterId={characterId} />;
}
