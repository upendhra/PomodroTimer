'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Play, Pause, Square, RotateCcw, Coffee } from 'lucide-react';
import { taskLogApi } from '@/lib/api';
import TimerControls from './TimerControls';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    notes: string;
    status: string;
    created_at: string;
  };
  onUpdate: () => void;
}

interface TaskTimer {
  time: number;
  isRunning: boolean;
  isBreak: boolean;
  currentLogId: string | null;
  sessionStartTime: number | null;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [timer, setTimer] = useState<TaskTimer>({
    time: 0,
    isRunning: false,
    isBreak: false,
    currentLogId: null,
    sessionStartTime: null
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const startTimer = async () => {
    const now = new Date().toISOString();
    const sessionStart = Date.now();
    try {
      const data = await taskLogApi.createLog({
        task_id: task.id,
        start_time: now,
        is_break: timer.isBreak
      });

      setTimer(prev => ({
        ...prev,
        isRunning: true,
        currentLogId: data.id,
        sessionStartTime: sessionStart
      }));
    } catch (err) {
      console.error('Error starting timer:', err);
    }
  };

  const pauseTimer = async () => {
    if (!timer.currentLogId || !timer.sessionStartTime) return;

    const endTime = new Date().toISOString();
    const sessionDuration = Math.floor((Date.now() - timer.sessionStartTime) / 1000);

    try {
      await taskLogApi.updateLog(timer.currentLogId, {
        end_time: endTime,
        duration_seconds: sessionDuration
      });

      setTimer(prev => ({
        ...prev,
        isRunning: false,
        currentLogId: null,
        sessionStartTime: null
      }));
    } catch (err) {
      console.error('Error pausing timer:', err);
    }
  };

  const stopTimer = async () => {
    await pauseTimer();
  };

  const resetTimer = async () => {
    await stopTimer();
    setTimer(prev => ({ ...prev, time: 0, sessionStartTime: null }));
  };

  const toggleBreak = () => {
    setTimer(prev => ({ ...prev, isBreak: !prev.isBreak }));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => timer.isRunning ? pauseTimer() : startTimer();
  const handleStop = () => stopTimer();
  const handleReset = () => resetTimer();
  const handleBreakToggle = () => toggleBreak();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <CheckCircle2 className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-400' : 'text-white/40'}`} />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {task.title}
            </h3>
            {task.notes && (
              <p className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {task.notes}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono text-[#82f2ff] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {formatTime(timer.time)}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            task.status === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : timer.isBreak
              ? 'bg-orange-500/20 text-orange-400'
              : timer.isRunning
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-gray-500/20 text-gray-400'
          }`} style={{ fontFamily: "'Manrope', sans-serif" }}>
            {task.status === 'completed' ? 'Completed' : timer.isBreak ? 'Break' : timer.isRunning ? 'Active' : 'Pending'}
          </span>
        </div>
      </div>

      <TimerControls
        isRunning={timer.isRunning}
        isBreak={timer.isBreak}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onBreakToggle={handleBreakToggle}
      />
    </div>
  );
}
