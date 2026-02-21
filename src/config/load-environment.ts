import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

export type RuntimeEnvironment = "local" | "preview" | "production";

const ENV_FILE_BY_TARGET: Record<RuntimeEnvironment, string> = {
  local: ".env.local",
  preview: ".env.preview",
  production: ".env.production",
};

let isLoaded = false;

const isRuntimeEnvironment = (value: string): value is RuntimeEnvironment =>
  value === "local" || value === "preview" || value === "production";

const readEnvFile = (filePath: string): Record<string, string> => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return dotenv.parse(fs.readFileSync(filePath));
};

export const resolveRuntimeEnvironment = (env: NodeJS.ProcessEnv): RuntimeEnvironment => {
  const explicitTarget = env.APP_ENV?.trim().toLowerCase();
  if (explicitTarget && isRuntimeEnvironment(explicitTarget)) {
    return explicitTarget;
  }

  const vercelTarget = env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelTarget === "preview" || vercelTarget === "production") {
    return vercelTarget;
  }

  if (vercelTarget === "development") {
    return "local";
  }

  return "local";
};

export const ensureEnvironmentLoaded = (cwd = process.cwd()): void => {
  if (isLoaded) {
    return;
  }

  const baseFilePath = path.resolve(cwd, ".env");
  const baseEnv = readEnvFile(baseFilePath);
  const target = resolveRuntimeEnvironment({
    ...baseEnv,
    ...process.env,
  });
  const targetFilePath = path.resolve(cwd, ENV_FILE_BY_TARGET[target]);
  const targetEnv = readEnvFile(targetFilePath);
  const runtimeEnvKeys = new Set(Object.keys(process.env));

  for (const [key, value] of Object.entries({
    ...baseEnv,
    ...targetEnv,
  })) {
    if (runtimeEnvKeys.has(key)) {
      continue;
    }

    process.env[key] = value;
  }

  isLoaded = true;
};

export const resetEnvironmentLoaderForTests = (): void => {
  isLoaded = false;
};
