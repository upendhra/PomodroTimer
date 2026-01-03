'use client';

import { memo } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const defaultGoals = [
  { label: 'Sessions', current: 32, target: 40, color: '#06b6d4' },
  { label: 'Hours', current: 15.5, target: 20, color: '#22d3ee' },
  { label: 'Tasks', current: 12, target: 15, color: '#10b981' },
];

interface WeeklyGoalsChartProps {
  data?: typeof defaultGoals;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold text-white/90">{entry.payload.label}</p>
      <p className="text-emerald-300">{entry.payload.current} / {entry.payload.target}</p>
    </div>
  );
};

function WeeklyGoalsChartComponent({ data = defaultGoals }: WeeklyGoalsChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 110, damping: 14 }}
      className="h-[250px] w-full"
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax / 5) * 5)]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar
            dataKey="target"
            fill="rgba(148,163,184,0.2)"
            stackId="a"
            radius={[12, 12, 12, 12]}
            barSize={28}
          />
          <Bar
            dataKey="current"
            stackId="a"
            radius={[12, 12, 12, 12]}
            barSize={28}
          >
            {data.map((entry, index) => (
              <motion.rect
                key={entry.label}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: 0.25 + index * 0.12,
                  type: 'spring',
                  stiffness: 150,
                  damping: 18,
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export const WeeklyGoalsChart = memo(WeeklyGoalsChartComponent);
