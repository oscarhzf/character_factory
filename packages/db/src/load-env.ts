import fs from "node:fs";
import path from "node:path";

const globalScope = globalThis as typeof globalThis & {
  __characterFactoryEnvLoaded?: boolean;
};

function findWorkspaceRoot(startDirectory: string): string | null {
  let currentDirectory = startDirectory;

  while (true) {
    if (fs.existsSync(path.join(currentDirectory, "pnpm-workspace.yaml"))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return null;
    }

    currentDirectory = parentDirectory;
  }
}

function listCandidateEnvFiles(rootDirectory: string): string[] {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return [
    path.join(rootDirectory, `.env.${nodeEnv}.local`),
    path.join(rootDirectory, ".env.local"),
    path.join(rootDirectory, `.env.${nodeEnv}`),
    path.join(rootDirectory, ".env")
  ];
}

export function ensureRootEnvLoaded(): void {
  if (globalScope.__characterFactoryEnvLoaded) {
    return;
  }

  const workspaceRoot = findWorkspaceRoot(process.cwd());

  if (!workspaceRoot) {
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
