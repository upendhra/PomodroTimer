import { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export default function DashboardCard({ title, subtitle, children, className = "" }: DashboardCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.07)] backdrop-blur-2xl shadow-[0_8px_22px_rgba(15,23,42,0.18)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.28)] transition-all duration-500 hover:-translate-y-1 animate-glass-fade ${className}`}
    >
      <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
      <div className="relative p-6 text-[#e9f2ff]">
        {title && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-[#8FB7D1]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</p>
            {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
