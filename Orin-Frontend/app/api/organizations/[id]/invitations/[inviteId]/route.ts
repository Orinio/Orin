import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/app/api/_lib/forward';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const { id, inviteId } = await params;
  return forwardToBackend(req, `/organizations/${id}/invitations/${inviteId}`, { method: 'DELETE' });
}
