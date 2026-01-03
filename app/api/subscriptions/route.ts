import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { user_id, plan } = await req.json()

    if (!user_id || !plan) {
      return NextResponse.json(
        { error: 'Missing user_id or plan' }, 
        { status: 400 }
      )
    }

    // Check if user already has an active subscription
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (existing) {
      // Update existing subscription
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) {
        console.error('Subscription update error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    } else {
      // Create new subscription
      const { error } = await supabaseAdmin.from('subscriptions').insert({
        user_id,
        plan,
        status: 'active'
      })

      if (error) {
        console.error('Subscription insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ subscribed: true })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    return NextResponse.json({ active: !!data, subscription: data })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json({ active: false })
  }
}
