interface PersonaBadgeProps {
  persona: 'student' | 'employee' | 'writer' | 'professor' | 'addiction_reliever';
  size?: 'sm' | 'md';
}

export default function PersonaBadge({ persona, size = 'md' }: PersonaBadgeProps) {
  const colors = {
    student: 'from-purple-500 to-blue-600',
    employee: 'from-green-400 to-blue-600',
    writer: 'from-orange-400 to-red-600',
    professor: 'from-yellow-400 to-orange-600',
    addiction_reliever: 'from-pink-400 to-purple-600'
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base'
  };

  const initial = persona.charAt(0).toUpperCase();

  return (
    <div className={`rounded-full bg-gradient-to-br ${colors[persona]} flex items-center justify-center text-white font-bold shadow-lg ${sizes[size]}`}>
      {initial}
    </div>
  );
}
