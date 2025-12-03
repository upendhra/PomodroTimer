import React from 'react';

interface CardProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  glowDirection?: 'top-left' | 'top-right' | 'center';
  className?: string;
}

export default function Card({ children, icon, glowDirection = 'top-right', className = '' }: CardProps) {
  return (
    <div className={`group relative overflow-hidden bg-white/10 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 animate-aurora-card-drift ${className}`}>
      {/* Soft Pastel Gradient Border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-purple-200/30 via-cyan-200/20 to-indigo-200/30">
        <div className="absolute inset-[1px] bg-white/10 backdrop-blur-md rounded-2xl"></div>
      </div>

      {/* Icon */}
      {icon && (
        <div className="relative z-10 mb-4 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-cyan-300 flex items-center justify-center shadow-md shadow-purple-200/30">
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
