import { createClient } from '@/lib/supabase/client';
import { BoardTaskCard } from '@/components/playarea/types';

export interface TaskLimitStatus {
  currentCount: number;
  maxLimit: number;
  canCreate: boolean;
  hasCompletedTasks: boolean;
  message?: string;
}

export interface TaskLimitValidation {
  isValid: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

export class TaskBucketService {
  private static readonly MAX_TASKS = 10;
  private static supabase = createClient();

  /**
   * Check current task limit status for a project
   */
  static async getTaskLimitStatus(projectId: string): Promise<TaskLimitStatus> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Check if Supabase client is available
    if (!this.supabase) {
      throw new Error('Database client not available');
    }

    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('id, status, completed_at')
      .eq('project_id', projectId);
      // Temporarily removed .is('archive_after', null) to test column existence

    if (error) {
      console.error('Database error in getTaskLimitStatus:', error);
      throw new Error(`Failed to fetch task data: ${error.message || 'Unknown database error'}`);
    }

    const currentCount = tasks?.length || 0;
    const hasCompletedTasks = tasks?.some((task: BoardTaskCard) =>
      task.status === 'todo' && task.completedAt
    ) || false;

    const canCreate = currentCount < this.MAX_TASKS;

    let message: string | undefined;
    if (!canCreate) {
      message = hasCompletedTasks
        ? this.getClearCompletedMessage()
        : this.getCompleteExistingMessage();
    }

    return {
      currentCount,
      maxLimit: this.MAX_TASKS,
      canCreate,
      hasCompletedTasks,
      message
    };
  }

  /**
   * Validate if a new task can be created (considering current local tasks)
   */
  static async validateTaskCreation(projectId: string, currentLocalCount?: number): Promise<TaskLimitValidation> {
    try {
      const status = await this.getTaskLimitStatus(projectId);

      // Use local count if provided, otherwise use database count
      // This handles cases where local state has been modified but not yet saved to DB
      const effectiveCount = currentLocalCount !== undefined ? currentLocalCount : status.currentCount;

      const canCreate = effectiveCount < this.MAX_TASKS;

      if (canCreate) {
        const remaining = this.MAX_TASKS - effectiveCount;
        return {
          isValid: true,
          message: `💪 Elite focus! Task ${effectiveCount + 1} of ${this.MAX_TASKS} ready for your champion performance!`,
          type: 'success'
        };
      }

      return {
        isValid: false,
        message: status.message || 'Task limit reached',
        type: 'warning'
      };
    } catch (error) {
      console.error('Exception in validateTaskCreation:', error);

      // Ensure we always return a proper error object
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw new Error(`Task validation failed: ${errorMessage}`);
    }
  }

  /**
   * Get count of completed tasks that can be cleared
   */
  static async getCompletedTaskCount(projectId: string): Promise<number> {
    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'todo')
      .not('completed_at', 'is', null);

    if (error) {
      console.error('Failed to count completed tasks:', error);
      return 0;
    }

    return tasks?.length || 0;
  }

  /**
   * Clear all completed tasks (permanently delete them)
   */
  static async clearCompletedTasks(projectId: string): Promise<{ clearedCount: number }> {
    // First get the count of tasks that will be deleted
    const { data: tasksToDelete, error: countError } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'todo')
      .not('completed_at', 'is', null);

    if (countError) {
      console.error('Failed to count tasks for deletion:', countError);
      throw countError;
    }

    const clearedCount = tasksToDelete?.length || 0;

    if (clearedCount === 0) {
      return { clearedCount: 0 };
    }

    // Actually delete the completed tasks
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId)
      .eq('status', 'todo')
      .not('completed_at', 'is', null);

    if (error) {
      console.error('Failed to delete completed tasks:', error);
      throw error;
    }

    return { clearedCount };
  }

  /**
   * Motivating message when completed tasks need to be cleared
   */
  private static getClearCompletedMessage(): string {
    return "🎯 Mission Control: Maximum tasks reached! 🚀 Clear your completed victories to unlock space for new challenges!";
  }

  /**
   * Motivating message when no completed tasks exist
   */
  private static getCompleteExistingMessage(): string {
    return "💪 Elite Performer! Task limit hit! Complete or edit existing tasks to create room for fresh victories!";
  }

  /**
   * Get encouraging progress message
   */
  static getProgressMessage(currentCount: number): string {
    const progress = Math.floor((currentCount / this.MAX_TASKS) * 100);

    if (progress < 30) {
      return `🌱 Getting started! ${currentCount} of ${this.MAX_TASKS} tasks planned.`;
    } else if (progress < 60) {
      return `📈 Building momentum! ${currentCount} of ${this.MAX_TASKS} tasks ready.`;
    } else if (progress < 90) {
      return `💪 Almost there! ${currentCount} of ${this.MAX_TASKS} tasks set.`;
    } else {
      return `🎯 Full mission ready! ${currentCount} of ${this.MAX_TASKS} tasks loaded.`;
    }
  }
}
