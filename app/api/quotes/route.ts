import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { searchParams } = new URL(request.url);
  const persona = searchParams.get('persona');
  const category = searchParams.get('category');
  const language = searchParams.get('language');

  try {
    let query = supabase.from('quotes').select('*');

    if (persona) query = query.eq('persona', persona);
    if (category) query = query.eq('category', category);
    if (language) query = query.eq('language', language);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}
