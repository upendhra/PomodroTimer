interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r from-purple-400 to-blue-600 bg-clip-text text-transparent font-bold ${className}`}>
      {children}
    </span>
  );
}
