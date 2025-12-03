"use client";

export default function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Layered Aurora Blobs */}
      <div className="absolute -top-[30%] -left-[30%] w-[800px] h-[800px] bg-gradient-to-br from-cyan-400/50 via-purple-500/60 to-violet-600/40 rounded-full blur-[180px] animate-aurora-blob-1"></div>
      <div className="absolute top-[20%] left-[40%] w-[700px] h-[700px] bg-gradient-to-tr from-blue-400/60 via-indigo-500/50 to-cyan-500/40 rounded-full blur-[160px] animate-aurora-blob-2"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[650px] h-[650px] bg-gradient-to-bl from-violet-400/50 via-purple-600/60 to-blue-500/40 rounded-full blur-[170px] animate-aurora-blob-3"></div>
      <div className="absolute top-[50%] -right-[20%] w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500/40 via-indigo-600/50 to-purple-400/60 rounded-full blur-[150px] animate-aurora-blob-4"></div>
      <div className="absolute -bottom-[10%] left-[10%] w-[750px] h-[750px] bg-gradient-to-br from-indigo-500/50 via-cyan-400/60 to-violet-500/40 rounded-full blur-[190px] animate-aurora-blob-5"></div>

      {/* Animated Wave Streaks */}
      <div className="absolute top-[10%] left-[10%] w-[1200px] h-[200px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent rounded-full blur-[100px] animate-aurora-wave-1"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[1000px] h-[150px] bg-gradient-to-l from-transparent via-purple-500/40 to-transparent rounded-full blur-[120px] animate-aurora-wave-2"></div>
    </div>
  );
}
