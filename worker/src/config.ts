const DEFAULT_TARGET_URL = "https://google.com";

export function parseTargetUrls(env: NodeJS.ProcessEnv): string[] {
  const raw = env.TARGET_URLS || env.TARGET_URL || DEFAULT_TARGET_URL;
  const urls = raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set(urls.length > 0 ? urls : [DEFAULT_TARGET_URL]));
}

export function getDbPath(env: NodeJS.ProcessEnv): string {
  return env.DB_PATH || "/data/sla-guardian.db";
}
