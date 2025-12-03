'use client';

import { useProjectCreation } from '@/hooks/useProjectCreation';

function getDatesBetween(start: string, end: string): string[] {
  const dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function ProjectCreationStep2() {
  const { formData, updatePlannedHours } = useProjectCreation();

  const handleHourChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    updatePlannedHours(key, numValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          How many hours do you plan to contribute?
        </h3>

        {formData.durationType === 'date_range' && formData.startDate && formData.endDate && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {getDatesBetween(formData.startDate, formData.endDate).map((date) => (
              <div key={date} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <label className="text-white/80 min-w-0 flex-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.plannedHours[date] || ''}
                  onChange={(e) => handleHourChange(date, e.target.value)}
                  className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#82f2ff]/50 focus:border-[#82f2ff] backdrop-blur-sm transition-all"
                  placeholder="0"
                />
                <span className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>hrs</span>
              </div>
            ))}
          </div>
        )}

        {formData.durationType === 'daily' && (
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <label className="text-white/80 flex-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Daily Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.plannedHours['daily'] || ''}
              onChange={(e) => handleHourChange('daily', e.target.value)}
              className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#f4b2ff]/50 focus:border-[#f4b2ff] backdrop-blur-sm transition-all"
              placeholder="0"
            />
            <span className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>hrs</span>
          </div>
        )}

        {formData.durationType === 'weekday_selection' && (
          <div className="space-y-3">
            {formData.selectedWeekdays.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <label className="text-white/80 flex-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {day}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.plannedHours[day] || ''}
                  onChange={(e) => handleHourChange(day, e.target.value)}
                  className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#b57aff]/50 focus:border-[#b57aff] backdrop-blur-sm transition-all"
                  placeholder="0"
                />
                <span className="text-white/60 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>hrs</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
