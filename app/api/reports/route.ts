import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_id, content_type_uid, entry_uid, reason } = await req.json()

  await supabase.from('reports').insert({
    user_id,
    content_type_uid,
    entry_uid,
    reason
  })

  return NextResponse.json({ reported: true })
}
