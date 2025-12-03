interface NavbarProps {
  title?: string;
  children?: React.ReactNode;
}

export default function Navbar({ title = 'Dashboard', children }: NavbarProps) {
  return (
    <nav className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl p-4 shadow-lg border-b border-white/10 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Persona Badge Placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
          S
        </div>
        {/* Theme Switcher Placeholder */}
        <div className="text-white/60">Theme</div>
        {children}
      </div>
    </nav>
  );
}
