interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">{title}</h2>
      {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
      <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full mx-auto mt-4"></div>
    </div>
  );
}
