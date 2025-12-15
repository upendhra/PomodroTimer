'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type DurationType = 'date_range' | 'daily';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectCreationModal({ isOpen, onClose }: ProjectCreationModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('date_range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [plannedHours, setPlannedHours] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  const getDatesBetween = (start: string, end: string): string[] => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleHourChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setPlannedHours(prev => ({ ...prev, [key]: numValue }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleCreate = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      // Prepare data
      const projectData = {
        user_id: user.id,
        project_name: projectName,
        duration_type: durationType,
        start_date: startDate || null,
        end_date: endDate || null,
        planned_hours: plannedHours,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return;
      }

      // Redirect to project page
      router.push(`/dashboard/projects/${data.id}`);
      onClose();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-[2px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Create Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-[#82f2ff] text-black' : 'bg-white/20 text-white/60'}`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-[#82f2ff]' : 'bg-white/20'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-[#82f2ff] text-black' : 'bg-white/20 text-white/60'}`}>
            2
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 ? (
          <>
            {/* Project Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm"
                placeholder="Enter project name"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              />
            </div>

            {/* Duration Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Duration Type
              </label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setDurationType('date_range')}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    durationType === 'date_range'
                      ? 'border-[#82f2ff]/50 bg-[#82f2ff]/10 shadow-lg shadow-[#82f2ff]/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  } backdrop-blur-sm`}
                >
                  <Calendar className={`w-5 h-5 ${durationType === 'date_range' ? 'text-[#82f2ff]' : 'text-white/70'}`} />
                  <span className="text-white font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Date Range</span>
                </button>
                <button
                  onClick={() => setDurationType('daily')}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    durationType === 'daily'
                      ? 'border-[#f4b2ff]/50 bg-[#f4b2ff]/10 shadow-lg shadow-[#f4b2ff]/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  } backdrop-blur-sm`}
                >
                  <Clock className={`w-5 h-5 ${durationType === 'daily' ? 'text-[#f4b2ff]' : 'text-white/70'}`} />
                  <span className="text-white font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Daily</span>
                </button>
              </div>
            </div>

            {/* Conditional UI */}
            {durationType === 'date_range' && (
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm"
                  />
                </div>
              </div>
            )}

          </>
        ) : (
          <>
            {/* Step 2: Planned Hours */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                How many hours do you plan to contribute?
              </h3>

              {durationType === 'date_range' && startDate && endDate && (
                <div className="space-y-3">
                  {getDatesBetween(startDate, endDate).map((date) => (
                    <div key={date} className="flex items-center gap-4">
                      <label className="text-white/80 min-w-0 flex-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={plannedHours[date] || ''}
                        onChange={(e) => handleHourChange(date, e.target.value)}
                        className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm"
                        placeholder="0"
                      />
                      <span className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>hrs</span>
                    </div>
                  ))}
                </div>
              )}

              {durationType === 'daily' && (
                <div className="flex items-center gap-4">
                  <label className="text-white/80 flex-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Daily Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={plannedHours['daily'] || ''}
                    onChange={(e) => handleHourChange('daily', e.target.value)}
                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#f4b2ff]/50 focus:border-[#f4b2ff] backdrop-blur-sm"
                    placeholder="0"
                  />
                  <span className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>hrs</span>
                </div>
              )}

            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentStep === 2 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {currentStep === 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-4 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Create Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
