import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';

// Create anon client for all operations (no auth required)
const createSupabaseClient = () => {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { projectId, taskOrders } = await request.json();

    if (!projectId || !taskOrders || !Array.isArray(taskOrders)) {
      return NextResponse.json({
        error: 'Project ID and taskOrders array are required'
      }, { status: 400 });
    }

    // Validate taskOrders format
    for (const order of taskOrders) {
      if (!order.id || typeof order.sortOrder !== 'number') {
        return NextResponse.json({
          error: 'Each task order must have id and sortOrder (number)'
        }, { status: 400 });
      }
    }

    console.log('🔄 Updating sort orders:', { projectId, taskOrders });

    // First check if sort_order column exists
    try {
      const { error: columnTest } = await supabase
        .from('tasks')
        .select('sort_order')
        .limit(1);

      if (columnTest) {
        console.log('⚠️ sort_order column not available, reorder endpoint disabled');
        return NextResponse.json({
          error: 'Sort ordering not available. Please run database migration first.'
        }, { status: 400 });
      }
    } catch (columnError) {
      console.log('⚠️ sort_order column not available, reorder endpoint disabled');
      return NextResponse.json({
        error: 'Sort ordering not available. Please run database migration first.'
      }, { status: 400 });
    }
    const updatePromises = taskOrders.map(async (order) => {
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: order.sortOrder })
        .eq('id', order.id)
        .eq('project_id', projectId); // Extra safety check

      if (error) {
        console.error(`❌ Error updating sort_order for task ${order.id}:`, error);
        throw error;
      }

      console.log(`✅ Updated sort_order for task ${order.id} to ${order.sortOrder}`);
    });

    await Promise.all(updatePromises);

    console.log('✅ All sort orders updated successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error in reorder tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
