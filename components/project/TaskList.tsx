'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { taskApi, taskLogApi } from '@/lib/api';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';

interface TaskListProps {
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  notes: string;
  status: string;
  created_at: string;
}

export default function TaskList({ projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const data = await taskApi.getProjectTasks(projectId);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAdded = () => {
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-lg">
        <div className="text-center text-white">Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tasks
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-black font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
              No tasks yet. Create your first task to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
            ))}
          </div>
        )}
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
        onTaskAdded={handleTaskAdded}
      />
    </>
  );
}
