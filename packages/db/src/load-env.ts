import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const globalScope = globalThis as typeof globalThis & {
  __characterFactoryEnvLoaded?: boolean;
};
const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

function listCandidateEnvFiles(rootDirectory: string): string[] {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return [
    path.join(/* turbopackIgnore: true */ rootDirectory, `.env.${nodeEnv}.local`),
    path.join(/* turbopackIgnore: true */ rootDirectory, ".env.local"),
    path.join(/* turbopackIgnore: true */ rootDirectory, `.env.${nodeEnv}`),
    path.join(/* turbopackIgnore: true */ rootDirectory, ".env")
  ];
}

export function ensureRootEnvLoaded(): void {
  if (globalScope.__characterFactoryEnvLoaded) {
    return;
  }

  if (
    !fs.existsSync(
      path.join(/* turbopackIgnore: true */ workspaceRoot, "pnpm-workspace.yaml")
    )
  ) {
    globalScope.__characterFactoryEnvLoaded = true;
    return;
  }

  for (const candidateFile of listCandidateEnvFiles(workspaceRoot)) {
    if (fs.existsSync(candidateFile)) {
      process.loadEnvFile(candidateFile);
    }
  }

  globalScope.__characterFactoryEnvLoaded = true;
}
