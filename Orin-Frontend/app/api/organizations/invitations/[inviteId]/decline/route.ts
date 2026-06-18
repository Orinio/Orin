import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/app/api/_lib/forward';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  return forwardToBackend(req, `/organizations/invitations/${inviteId}/decline`, { method: 'DELETE' });
}
