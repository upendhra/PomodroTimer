interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
}: ButtonProps) {
  const base =
    'relative inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200/80 overflow-hidden group';

  const variants = {
    primary:
      'text-white shadow-[0_15px_35px_rgba(123,97,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.45),transparent_55%),linear-gradient(120deg,#7b5bff,#00d4ff,#ffa9ff)] bg-[length:200%_200%] animate-liquid-gradient hover:animate-liquid-gradient-fast',
    secondary:
      'text-gray-800 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 active:translate-y-0.5 border border-white/70',
    glass:
      'text-white bg-white/15 border border-white/30 shadow-[0_18px_40px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 active:translate-y-0.5'
  } as const;

  return (
    <button
      onClick={onClick}
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <>
          <span className="absolute inset-0 rounded-2xl bg-white/25 blur-lg opacity-30 group-hover:opacity-45 transition-opacity duration-500" />
          <span className="absolute inset-[1px] rounded-2xl border border-white/20" />
        </>
      )}
    </button>
  );
}
