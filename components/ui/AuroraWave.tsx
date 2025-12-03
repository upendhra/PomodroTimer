"use client";

export default function AuroraWave() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full animate-aurora-wave-oscillate"
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9f5bff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#9f5bff" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flowing Aurora Wave Paths */}
        <path
          d="M-100 400 Q300 300 700 350 T1200 400"
          stroke="url(#auroraGradient)"
          strokeWidth="6"
          fill="none"
          filter="url(#glow)"
          className="animate-aurora-wave-flow-1"
        />
        <path
          d="M-100 450 Q350 350 750 400 T1200 450"
          stroke="url(#auroraGradient)"
          strokeWidth="4"
          fill="none"
          filter="url(#glow)"
          className="animate-aurora-wave-flow-2"
        />
        <path
          d="M-100 500 Q400 400 800 450 T1200 500"
          stroke="url(#auroraGradient)"
          strokeWidth="5"
          fill="none"
          filter="url(#glow)"
          className="animate-aurora-wave-flow-3"
        />
      </svg>
    </div>
  );
}
