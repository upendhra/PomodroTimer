'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTaskAdded: () => void;
}

export default function AddTaskModal({ isOpen, onClose, projectId, onTaskAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          project_id: projectId,
          title: title.trim(),
          notes: notes.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating task:', error);
      } else {
        setTitle('');
        setNotes('');
        onTaskAdded();
        onClose();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-[2px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Add New Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm"
              placeholder="Enter task title"
              style={{ fontFamily: "'Manrope', sans-serif" }}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm resize-none"
              placeholder="Add any additional notes..."
              rows={3}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
