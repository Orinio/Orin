'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  status: string;
  organizations: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const inviteId = params.inviteId as string;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const { data, error: fetchError } = await supabase!
          .from('org_invitations')
          .select('*, organizations(name, slug, logo_url)')
          .eq('id', inviteId)
          .eq('status', 'pending')
          .single();

        if (fetchError || !data) {
          setError('Invitation not found or already used');
          return;
        }

        setInvitation(data as Invitation);
      } catch {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [inviteId]);

  async function handleAccept() {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/invitations/${inviteId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to accept invitation');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/org'), 2000);
    } catch {
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDecline() {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/invitations/${inviteId}/decline`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Failed to decline invitation');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium">Success!</p>
            <p className="text-muted-foreground text-sm mt-1">
              Redirecting you shortly...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Organization Invitation</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited to join an organization
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{invitation.organizations.name}</h3>
              <p className="text-sm text-muted-foreground">
                Role: <span className="capitalize font-medium">{invitation.role}</span>
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
