'use client';

import { Calendar, Clock, Repeat, Info } from 'lucide-react';
import { useProjectCreation } from '@/hooks/useProjectCreation';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProjectCreationStep1() {
  const {
    formData,
    updateProjectName,
    updateDurationType,
    updateStartDate,
    updateEndDate,
    toggleWeekday
  } = useProjectCreation();

  const isDateRange = formData.durationType === 'date_range';

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Project Name *
        </label>
        <input
          type="text"
          value={formData.projectName}
          onChange={(e) => updateProjectName(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm transition-all"
          placeholder="Enter project name"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        />
      </div>

      {/* Duration Type Selection */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Duration Type
        </label>
        <div className="grid grid-cols-1 gap-3">
          <div
            className={`rounded-lg border transition-all backdrop-blur-sm ${
              isDateRange
                ? 'border-[#82f2ff]/50 bg-[#82f2ff]/10 shadow-lg shadow-[#82f2ff]/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <button
              onClick={() => updateDurationType('date_range')}
              className="w-full flex items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${isDateRange ? 'text-[#82f2ff]' : 'text-white/70'}`} />
                <span className="text-white font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Date Range</span>
              </div>
              {isDateRange && (
                <span className="text-xs uppercase tracking-wide text-[#0f1c1d] bg-[#82f2ff] px-2 py-1 rounded-full font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Enabled
                </span>
              )}
            </button>
            <div
              className={`transition-[max-height] duration-300 ease-out overflow-hidden ${
                isDateRange ? 'max-h-40 px-4 pb-4' : 'max-h-0'
              }`}
            >
              {isDateRange && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => updateDurationType('daily')}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
              formData.durationType === 'daily'
                ? 'border-[#f4b2ff]/50 bg-[#f4b2ff]/10 shadow-lg shadow-[#f4b2ff]/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            } backdrop-blur-sm`}
          >
            <Clock className={`w-5 h-5 ${formData.durationType === 'daily' ? 'text-[#f4b2ff]' : 'text-white/70'}`} />
            <span className="text-white font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Daily</span>
          </button>
          <button
            onClick={() => updateDurationType('weekday_selection')}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
              formData.durationType === 'weekday_selection'
                ? 'border-[#b57aff]/50 bg-[#b57aff]/10 shadow-lg shadow-[#b57aff]/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            } backdrop-blur-sm`}
          >
            <Repeat className={`w-5 h-5 ${formData.durationType === 'weekday_selection' ? 'text-[#b57aff]' : 'text-white/70'}`} />
            <span className="text-white font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Weekday Selection</span>
          </button>
        </div>

        {formData.durationType === 'daily' && (
          <div className="mt-3 flex gap-3 rounded-lg border border-[#f4b2ff]/40 bg-[#f4b2ff]/10 px-4 py-3 text-sm text-white/80" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <Info className="w-4 h-4 text-[#f4b2ff] shrink-0 mt-0.5" />
            <p>
              Daily tracking runs continuously across all days. Skipping a day will record <span className="font-semibold text-white">0 hrs</span> for that date in your stats.
            </p>
          </div>
        )}
      </div>

      {/* Conditional UI */}
      {formData.durationType === 'weekday_selection' && (
        <div>
          <label className="block text-sm font-medium text-white/80 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Select Weekdays
          </label>
          <div className="flex gap-2 flex-wrap">
            {weekdays.map((day) => (
              <button
                key={day}
                onClick={() => toggleWeekday(day)}
                className={`px-3 py-2 rounded-full border transition-all ${
                  formData.selectedWeekdays.includes(day)
                    ? 'border-[#b57aff]/50 bg-[#b57aff]/20 text-[#b57aff] shadow-lg shadow-[#b57aff]/20'
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                } backdrop-blur-sm`}
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
