import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: 'Missing plan' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        console.error('Subscription update error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      // Create new subscription
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id, // Use authenticated user's ID
        plan,
        status: 'active'
      });

      if (error) {
        console.error('Subscription insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ active: false });
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return NextResponse.json({ active: !!data, subscription: data });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ active: false });
  }
}
