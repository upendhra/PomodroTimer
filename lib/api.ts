import { supabase } from '@/lib/supabase';

// Project API functions
export const projectApi = {
  async createProject(projectData: {
    user_id: string;
    project_name: string;
    duration_type: string;
    start_date: string | null;
    end_date: string | null;
    weekdays: string[];
    planned_hours: Record<string, number>;
    status: string;
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  },

  async getProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(projectId: string, updates: Partial<{
    project_name: string;
    duration_type: string;
    start_date: string | null;
    end_date: string | null;
    weekdays: string[];
    planned_hours: Record<string, number>;
    status: string;
  }>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Task API functions
export const taskApi = {
  async createTask(taskData: {
    project_id: string;
    title: string;
    notes?: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        status: taskData.status || 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProjectTasks(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateTask(taskId: string, updates: Partial<{
    title: string;
    notes: string;
    status: string;
  }>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
};

// Task Log API functions
export const taskLogApi = {
  async createLog(logData: {
    task_id: string;
    start_time: string;
    end_time?: string;
    duration_seconds?: number;
    is_break?: boolean;
  }) {
    const { data, error } = await supabase
      .from('task_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLog(logId: string, updates: Partial<{
    end_time: string;
    duration_seconds: number;
  }>) {
    const { data, error } = await supabase
      .from('task_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTaskLogs(taskId: string) {
    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProjectLogs(projectId: string) {
    const { data, error } = await supabase
      .from('task_logs')
      .select(`
        *,
        tasks!inner(project_id)
      `)
      .eq('tasks.project_id', projectId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Auth API helpers
export const authApi = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Authentication required');
    return user;
  }
};
