"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  FolderKanban,
  Timer,
  History,
  BarChart3,
  Settings,
  Menu,
  User,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard/home", icon: Home },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Timer", href: "/dashboard/timer", icon: Timer },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ expanded, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isCollapsed = !expanded;

  return (
    <>
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 transition-[width] duration-300 ease-in-out ${
          expanded ? "w-[260px]" : "w-[96px]"
        }`}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-r-[32px] border border-white/10 bg-[rgba(5,4,18,0.82)] backdrop-blur-3xl shadow-[0_25px_65px_rgba(3,4,15,0.75)]">
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "linear-gradient(160deg, rgba(130,242,255,0.18) 0%, rgba(181,122,255,0.08) 45%, transparent 100%)" }} />

          <div className="w-full flex items-center justify-center pt-4 pb-3">
            <button
              onClick={onToggle}
              aria-label="Toggle Menu"
              className={`h-11 w-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-[#C8D9E6] flex items-center justify-center shadow-lg shadow-black/20 transition-all duration-150 ease-in-out hover:shadow-[#82F2FF]/40 hover:border-[#82F2FF]/40 ${
                isCollapsed ? "" : "rotate-90"
              }`}
            >
              <Menu className="h-5 w-5 transition-transform duration-300" />
            </button>
          </div>

          <nav className="relative mt-4 flex-1 space-y-2 px-3">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={label}
                  href={href}
                  title={label}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center rounded-2xl py-3 transition-all duration-300 ease-in-out ${
                    isActive
                      ? "bg-white/15 text-white shadow-[0_10px_25px_rgba(3,5,18,0.45)]"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  } ${expanded ? "gap-4 px-4 justify-start" : "gap-0 px-0 justify-center"}`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                    isActive ? "bg-white/25" : "bg-white/5 group-hover:bg-white/10"
                  }`}>
                    <Icon
                      className={`h-[18px] w-[18px] transition ${
                        isActive ? "text-[#0b0a1c]" : "text-white/75"
                      }`}
                      strokeWidth={1.6}
                    />
                  </span>
                  <span
                    className={`text-sm font-medium tracking-wide text-white transition-all duration-300 ease-in-out ${
                      expanded ? "ml-2 max-w-[120px] opacity-100" : "max-w-0 opacity-0"
                    } overflow-hidden whitespace-nowrap`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="relative mt-auto px-4 pb-8">
            <div className="flex items-center justify-between">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70 transition hover:bg-white/20">
                <User className="h-5 w-5" strokeWidth={1.6} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70 transition hover:bg-white/20">
                <LogOut className="h-5 w-5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      <motion.nav
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-around rounded-3xl border border-white/15 bg-[rgba(8,6,24,0.9)] backdrop-blur-2xl py-3 shadow-[0_20px_55px_rgba(3,4,15,0.65)]"
      >
        {navItems.slice(0, 4).map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} className="flex flex-col items-center gap-1 text-[0.65rem] text-white/70">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200 ${
                  isActive ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/60"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
