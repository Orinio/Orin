import { NextRequest, NextResponse } from 'next/server';
import { supabase, Database } from '@/lib/supabase';

type ContactInsert = Database['public']['Tables']['contact_messages']['Insert'];

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  let userId: string | null = null;
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();
    if (userData) {
      userId = userData.id;
    }
  }

  const insertData: ContactInsert = {
    name,
    email,
    subject: subject || null,
    message,
    status: 'new',
    user_id: userId,
  };

  const { data: contactMessage, error } = await supabase
    .from('contact_messages')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contactMessage }, { status: 201 });
}
