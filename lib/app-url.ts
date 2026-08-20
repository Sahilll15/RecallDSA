/**
 * The address to put in an email.
 *
 * NEXT_PUBLIC_APP_URL is easy to leave pointing at localhost after local
 * development, and a reminder full of localhost links fails silently: it sends,
 * it looks fine in the logs, and every link is dead. So a localhost value is
 * ignored whenever the platform tells us where we actually are.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];

function isLocal(url: string): boolean {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function normalise(url: string): string {
  const withProtocol = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return withProtocol.replace(/\/+$/, '');
}

export function resolveAppUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  const platform =
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();

  if (configured) {
    const normalised = normalise(configured);
    // Trust an explicit value unless it is a local address and the platform
    // knows a real one.
    if (!isLocal(normalised) || !platform) return normalised;
  }

  if (platform) return normalise(platform);

  return 'http://localhost:3000';
}
