'use client';

import { useEffect, useState } from 'react';

interface WelcomeCardProps {
  projectName: string;
}

export default function WelcomeCard({ projectName }: WelcomeCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/20 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.55)] max-w-2xl w-full mx-4 transition-all duration-1000 animate-fade-in ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/70 via-emerald-300/40 to-cyan-500/10 opacity-80"></div>
      <div className="absolute inset-0 bg-white/10 mix-blend-soft-light"></div>
      <div className="relative">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-2xl shadow-inner">
              ✨
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_5px_25px_rgba(15,23,42,0.45)] mb-4 animate-fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", animationDelay: '0.2s' }}>
            Welcome to {projectName}
          </h2>
          <p className="text-lg text-white/85 leading-relaxed animate-fade-in mb-3" style={{ animationDelay: '0.4s' }}>
            Take a deep breath. The valley is waking with light—let it guide your focus.
          </p>
          <p className="text-base text-white/75 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Your journey begins here. Ready to cultivate your productivity?
          </p>
        </div>
      </div>
    </div>
  );
}
