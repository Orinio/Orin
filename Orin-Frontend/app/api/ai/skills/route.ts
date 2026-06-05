import { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_lib/forward';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = `/ai/skills${url.search}`;
  return forwardToBackend(req, path);
}
