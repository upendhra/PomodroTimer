interface SidebarProps {
  isOpen?: boolean;
  children: React.ReactNode;
}

export default function Sidebar({ isOpen = true, children }: SidebarProps) {
  return (
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border-r border-white/20 shadow-2xl transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} z-40`}>
      <div className="p-4">
        {children}
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

export function NavItem({ icon, label, href = '#' }: NavItemProps) {
  return (
    <a
      href={href}
      className="flex items-center p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
    >
      <div className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </a>
  );
}
