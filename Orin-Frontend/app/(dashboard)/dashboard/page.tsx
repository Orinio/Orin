'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-context";
import { useCurrentUser } from "@/lib/queries/user";

import StudentDashboard from "@/components/dashboard/role-specific/StudentDashboard";
import EmployerDashboard from "@/components/dashboard/role-specific/EmployerDashboard";
import UniversityDashboard from "@/components/dashboard/role-specific/UniversityDashboard";
import AdminDashboard from "@/components/dashboard/role-specific/AdminDashboard";
import ModeratorDashboard from "@/components/dashboard/role-specific/ModeratorDashboard";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, initialized } = useAuth();
  const { role: userRole, loading: roleLoading } = useRole();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (user && !userLoading) {
      const hasCompletedOnboarding = typeof window !== 'undefined' && localStorage.getItem('orin.onboarded');
      if (!hasCompletedOnboarding && !user.fullName && !user.headline && !user.bio) {
        router.push('/onboarding');
      }
    }
  }, [user, userLoading, router]);

  if (!initialized || userLoading || roleLoading) {
    return <DashboardSkeleton />;
  }

  if (!authUser) {
    router.push('/signin');
    return null;
  }

  if (!user) return null;

  // Render dashboard based on role
  switch (userRole) {
    case 'employer':
      return <EmployerDashboard />;
    case 'university':
      return <UniversityDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'moderator':
      return <ModeratorDashboard />;
    case 'user':
    default:
      return <StudentDashboard />;
  }
}
