import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatar_url } = await req.json();

    const { error } = await supabase.from('profiles').upsert({
      id: user.id, // Use authenticated user's ID
      name,
      avatar_url,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('Error in POST /api/profiles:', err);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in GET /api/profiles:', err);
    return NextResponse.json(null);
  }
}
