import { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_lib/forward';

export async function GET(req: NextRequest) {
  return forwardToBackend(req, '/ai/usage');
}
