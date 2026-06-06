import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import { mapDbUserToUser } from '@/lib/utils';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!userData) {
    redirect('/signin');
  }

  const currentUser = mapDbUserToUser(userData);

  // Fetch dashboard data in parallel
  const [proofsResult, opportunitiesResult, coachNoteResult, statsResult] = await Promise.all([
    supabase
      .from('proof_cards')
      .select('*')
      .eq('user_id', userData.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('coach_notes')
      .select('*')
      .eq('user_id', userData.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('proof_cards')
      .select('id, verification_status, view_count, skills_extracted, skills_user_added, source_type')
      .eq('user_id', userData.id)
      .is('deleted_at', null),
  ]);

  const proofs = proofsResult.data || [];
  const opportunities = opportunitiesResult.data || [];
  const coachNote = coachNoteResult.data;
  const allProofs = statsResult.data || [];

  // Compute stats on server
  const totalViews = allProofs.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const verifiedCount = allProofs.filter((p) => p.verification_status === 'verified').length;
  const allSkills = Array.from(
    new Set(allProofs.flatMap((p) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))
  );
  const skillCounts = allSkills
    .map((skill) => ({
      name: skill,
      count: allProofs.filter((p) =>
        (p.skills_extracted || []).includes(skill) || (p.skills_user_added || []).includes(skill)
      ).length,
    }))
    .sort((a, b) => b.count - a.count);

  const sourceTypeCounts = allProofs.reduce((acc, p) => {
    acc[p.source_type] = (acc[p.source_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardClient
      initialUser={currentUser}
      initialProofs={proofs}
      initialOpportunities={opportunities}
      initialCoachNote={coachNote}
      initialStats={{
        proofsCount: allProofs.length,
        verifiedCount,
        totalViews,
        uniqueSkills: allSkills.length,
        topSkills: skillCounts.slice(0, 5),
        sourceTypeCounts,
        opportunitiesCount: opportunities.length,
      }}
    />
  );
}