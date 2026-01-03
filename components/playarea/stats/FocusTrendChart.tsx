'use client';

import { memo, useId, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

const defaultData = [
  { day: 'Mon', minutes: 25 },
  { day: 'Tue', minutes: 45 },
  { day: 'Wed', minutes: 38 },
  { day: 'Thu', minutes: 52 },
  { day: 'Fri', minutes: 41 },
  { day: 'Sat', minutes: 29 },
  { day: 'Sun', minutes: 35 },
];

interface FocusTrendChartProps {
  data?: typeof defaultData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-emerald-400/40 bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
        <p className="font-semibold text-emerald-300">{payload[0].payload.day}</p>
        <p className="text-white/80">{payload[0].value} min</p>
      </div>
    );
  }
  return null;
};

const buildGradientId = (prefix: string, unique: string) => `${prefix}-${unique.replace(/:/g, '')}`;

function FocusTrendChartComponent({ data = defaultData }: FocusTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientUniqueId = useId();
  const gradientId = buildGradientId('focus-trend', gradientUniqueId);
  const highlightGradientId = buildGradientId('focus-trend-highlight', gradientUniqueId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className="h-[250px] w-full"
    >
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id={highlightGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip cursor={{ fill: 'rgba(15,23,42,0.35)' }} content={<CustomTooltip />} />
          <Bar
            dataKey="minutes"
            radius={[12, 12, 4, 4]}
            barSize={28}
            animationDuration={1400}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={activeIndex === index ? `url(#${highlightGradientId})` : `url(#${gradientId})`}
                className="transition-all duration-300"
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export const FocusTrendChart = memo(FocusTrendChartComponent);
