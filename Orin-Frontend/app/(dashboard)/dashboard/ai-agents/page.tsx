'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * AI Agents page now redirects to the unified Super Agent chat.
 * The super-agent automatically selects the right agent and tools
 * for every query — no need for separate tabs.
 */
export default function AIAgentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/ai-chat');
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-ink)' }} />
        <p className="text-sm" style={{ color: 'var(--color-mist)', fontFamily: 'var(--font-body)' }}>
          Opening unified chat...
        </p>
      </div>
    </div>
  );
}
