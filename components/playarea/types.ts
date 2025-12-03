export type TaskPriority = 'high' | 'medium' | 'low';

export interface PlayTask {
  id: string;
  title: string;
  priority: TaskPriority;
  notes?: string;
  completed: boolean;
}

export type BoardTaskStatus = 'todo' | 'planned' | 'achieved';

export interface BoardTaskCard {
  id: string;
  title: string;
  priority: TaskPriority;
  duration: number; // minutes
  status: BoardTaskStatus;
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; description: string; color: string; pillBg: string }
> = {
  high: {
    label: 'High impact',
    description: 'Protect flow-critical missions',
    color: '#f87171',
    pillBg: 'rgba(248,113,113,0.18)',
  },
  medium: {
    label: 'Medium',
    description: 'Important but flexible',
    color: '#fb923c',
    pillBg: 'rgba(251,146,60,0.18)',
  },
  low: {
    label: 'Nice to have',
    description: 'Slot into recovery time',
    color: '#34d399',
    pillBg: 'rgba(52,211,153,0.18)',
  },
};

export const priorityOrder: TaskPriority[] = ['high', 'medium', 'low'];
