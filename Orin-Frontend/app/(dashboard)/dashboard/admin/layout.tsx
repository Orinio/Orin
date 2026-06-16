import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type UserRole = 'user' | 'admin' | 'moderator' | 'employer' | 'university';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const metaRole = (user.user_metadata?.role as string) || 'user';
  const validRoles: UserRole[] = ['user', 'admin', 'moderator', 'employer', 'university'];
  const role: UserRole = validRoles.includes(metaRole as UserRole) ? (metaRole as UserRole) : 'user';

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);
  const isAdmin = role === 'admin' || (user.email && adminEmails.includes(user.email));

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
