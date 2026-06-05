import type { Tool } from '../core/types.js';

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information about a topic, person, or certificate',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      num_results: { type: 'number', description: 'Number of results (default 5)' },
    },
    required: ['query'],
  },
  execute: async (args) => {
    try {
      const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;
      if (!apiKey) {
        return { success: true, data: { query: args.query, results: [], message: 'Web search not configured' } };
      }

      const res = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(args.query)}&api_key=${apiKey}&num=${args.num_results || 5}`);
      const data = await res.json() as any;
      return {
        success: true,
        data: {
          query: args.query,
          results: (data.organic_results || []).slice(0, args.num_results || 5).map((r: any) => ({
            title: r.title, url: r.link, snippet: r.snippet,
          })),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export const fetchWebpageTool: Tool = {
  name: 'fetch_webpage',
  description: 'Fetch and extract text content from a webpage URL',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' },
      max_length: { type: 'number', description: 'Max characters (default 2000)' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const urlCheck = isUrlSafe(args.url);
      if (!urlCheck.safe) return { success: false, error: urlCheck.reason };

      const res = await fetch(args.url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Orin-Bot/1.0' },
      });

      const html = await res.text();
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, args.max_length || 2000);

      return { success: true, data: { url: args.url, status: res.status, text_length: text.length, text } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
    }
  },
};

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal', '100.100.100.200'];
const BLOCKED_IP_RANGES = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^127\./, /^0\./];

export function isUrlSafe(url: string): { safe: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) return { safe: false, reason: 'Only HTTP/HTTPS allowed' };
    const hostname = urlObj.hostname.toLowerCase();
    if (BLOCKED_HOSTS.includes(hostname)) return { safe: false, reason: 'Internal URLs blocked' };
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) return { safe: false, reason: 'Internal IP blocked' };
    }
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return { safe: false, reason: 'Internal hostnames blocked' };
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}
