import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { BoardTaskCard } from '@/components/playarea/types';

// Create anon client for all operations (no auth required)
const createSupabaseClient = () => {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Query tasks with sort_order support when available
    let tasks;
    try {
      // Try to query with sort_order ordering (for databases with the migration)
      const { data: orderedTasks, error: orderedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!orderedError) {
        tasks = orderedTasks;
        console.log('✅ Using sort_order ordering');
      } else {
        throw orderedError; // Fall back to created_at ordering
      }
    } catch (sortOrderError) {
      console.log('⚠️ sort_order ordering not available, using created_at ordering');
      // Fallback to created_at ordering only
      const { data: fallbackTasks, error: fallbackError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('❌ Error fetching tasks with fallback:', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
      }

      tasks = fallbackTasks;
    }

    // Transform database tasks to BoardTaskCard format
    const transformedTasks: BoardTaskCard[] = tasks.map(task => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      duration: task.duration,
      status: task.status,
      completedAt: task.completed_at,
      sessionsCompleted: task.sessions_completed || 0,
      actualDuration: task.actual_duration || 0,
      createdAt: task.created_at,
      targetSessions: task.target_sessions,
      dailyGoal: task.daily_goal, // Keep as number (0 or 1) as expected by BoardTaskCard type
      sortOrder: task.sort_order || 0,
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('❌ Error in GET tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // CREATE new task
  try {
    const supabase = createSupabaseClient();
    const { title, priority, duration, status, projectId, targetSessions, dailyGoal } = await request.json();

    // Validate required fields
    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    // Get the highest sort_order for TO DO tasks in this project to assign the next order
    // This will be 0 if the column doesn't exist yet or if there are no existing tasks
    let sortOrder = 0;
    try {
      if (status === 'todo') {
        const { data: maxSortOrder } = await supabase
          .from('tasks')
          .select('sort_order')
          .eq('project_id', projectId)
          .eq('status', 'todo')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        sortOrder = (maxSortOrder?.sort_order ?? -1) + 1;
      }
    } catch (sortOrderError) {
      // If sort_order column doesn't exist, start from 0
      console.log('⚠️ sort_order column not available, using default ordering');
      sortOrder = 0;
    }

    const newTask = {
      id: crypto.randomUUID(), // Generate UUID on server
      project_id: projectId,
      title: title.trim(),
      priority: priority || 'medium',
      duration: duration || 25,
      status: status || 'todo',
      target_sessions: targetSessions || 1,
      daily_goal: dailyGoal ? 1 : 0, // Convert boolean to integer (0=false, 1=true)
      sort_order: sortOrder,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    console.log('✅ Task created:', data.id, 'Title:', data.title);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ Error in POST task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { taskId, updates } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.sessionsCompleted !== undefined) updateData.sessions_completed = updates.sessionsCompleted;
    if (updates.actualDuration !== undefined) updateData.actual_duration = updates.actualDuration;
    if (updates.targetSessions !== undefined) updateData.target_sessions = updates.targetSessions;
    if (updates.dailyGoal !== undefined) updateData.daily_goal = updates.dailyGoal; // Already a number (0 or 1)

    // Only add sort_order to updateData if it exists in the database schema
    if (updates.sortOrder !== undefined) {
      try {
        // Test if sort_order column exists by trying to select it
        const { error: testError } = await supabase
          .from('tasks')
          .select('sort_order')
          .eq('id', taskId)
          .limit(1);

        if (!testError) {
          updateData.sort_order = updates.sortOrder;
        } else {
          console.log('⚠️ sort_order column not available, skipping sortOrder update');
        }
      } catch (columnTestError) {
        console.log('⚠️ sort_order column not available, skipping sortOrder update');
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    console.log('✅ Task updated:', data.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('❌ Error in PATCH task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // DELETE task
  try {
    const supabase = createSupabaseClient();
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Check if task exists
    const { data: existingTask, error: checkError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', taskId)
      .single();

    if (checkError || !existingTask) {
      console.log('ℹ️ Task not found for deletion (already deleted or never existed):', taskId);
      // Return 204 - treat as successful (idempotent operation)
      return new NextResponse(null, { status: 204 });
    }

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('❌ Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    console.log('✅ Task deleted:', taskId, 'Title:', existingTask.title);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error in DELETE task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
