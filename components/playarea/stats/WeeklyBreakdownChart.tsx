'use client';

import { memo, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

interface WeeklyBreakdownChartProps {
  data?: { label: string; value: number; color: string }[];
}

const DEFAULT_DATA = [
  { label: 'Focused', value: 85, color: '#10b981' },
  { label: 'Break', value: 10, color: '#fbbf24' },
  { label: 'Distracted', value: 5, color: '#ef4444' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
        <p className="font-semibold text-white/90">{entry.name}</p>
        <p className="text-white/70">{entry.value}% of week</p>
      </div>
    );
  }
  return null;
};

function WeeklyBreakdownChartComponent({ data = DEFAULT_DATA }: WeeklyBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const focusedValue = useMemo(() => data.find((d) => d.label === 'Focused')?.value ?? 0, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 110, damping: 15 }}
      className="relative h-[250px] w-full"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        className="absolute inset-0"
      >
        <ResponsiveContainer>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.label}`}
                  fill={entry.color}
                  stroke={index === activeIndex ? '#ffffff' : 'transparent'}
                  strokeWidth={2}
                  style={{
                    filter: index === activeIndex ? 'drop-shadow(0 0 12px rgba(255,255,255,0.35))' : 'none',
                    transformOrigin: 'center',
                    transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">Focused</p>
        <p className="text-3xl font-semibold text-white">{focusedValue}%</p>
        <p className="text-xs text-white/60">of your week</p>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-3 text-xs text-white/70">
        {data.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
            <span>{segment.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const WeeklyBreakdownChart = memo(WeeklyBreakdownChartComponent);
