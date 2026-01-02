import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_id, target_type, target_entry_id } = await req.json()

  const { error } = await supabase.from('follows').insert({
    user_id,
    target_type,
    target_entry_id
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ followed: true })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const target_type = searchParams.get('target_type')
  const target_entry_id = searchParams.get('target_entry_id')

  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', target_type!)
    .eq('target_entry_id', target_entry_id!)

  return NextResponse.json({ count: count || 0 })
}

export async function DELETE(req: Request) {
  const { user_id, target_type, target_entry_id } = await req.json()

  await supabase
    .from('follows')
    .delete()
    .eq('user_id', user_id)
    .eq('target_type', target_type)
    .eq('target_entry_id', target_entry_id)

  return NextResponse.json({ followed: false })
}

