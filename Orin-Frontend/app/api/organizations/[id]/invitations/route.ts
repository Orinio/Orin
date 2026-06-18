import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/app/api/_lib/forward';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToBackend(req, `/organizations/${id}/invitations`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToBackend(req, `/organizations/${id}/invite`, { method: 'POST' });
}
