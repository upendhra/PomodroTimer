import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`glass-card relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_25px_70px_rgba(84,108,138,0.18)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
