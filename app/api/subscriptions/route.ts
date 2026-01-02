import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_id, plan } = await req.json()

  await supabase.from('subscriptions').insert({
    user_id,
    plan,
    status: 'active'
  })

  return NextResponse.json({ subscribed: true })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id!)
    .eq('status', 'active')
    .single()

  return NextResponse.json({ active: !!data })
}
