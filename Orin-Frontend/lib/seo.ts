export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orin.app').replace(/\/+$/, '');

export const SITE_NAME = 'ORIN';
export const DEFAULT_SEO_TITLE = 'ORIN - Turn Work Into Career Proof';
export const DEFAULT_SEO_DESCRIPTION =
  'Transform scattered projects, repos, and certificates into verified career proof. AI coach, proof cards, and real opportunities.';

export function toAbsoluteUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${SITE_URL}/${path}`;
  }
  return `${SITE_URL}${path}`;
}
