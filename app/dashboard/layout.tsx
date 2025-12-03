"use client";

import { useState, type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import FAB from "@/components/ui/FAB";
import ProjectCreationPopup from "@/components/project/ProjectCreationPopup";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/dashboard/home";
  const isProjectScreen = useMemo(
    () => pathname?.startsWith("/dashboard/projects/") ?? false,
    [pathname]
  );

  if (isProjectScreen) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {children}
        <ProjectCreationPopup />
      </div>
    );
  }

  return (
    <div className="galaxy-bg relative overflow-hidden">
      <div className="galaxy-stars" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(130,242,255,0.08),transparent_55%)]" />

      <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded((prev) => !prev)} />

      <div className="relative z-10 flex min-h-screen flex-col md:pl-[110px] lg:pl-[170px]">
        <div className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10">
          <main className="relative z-10 mx-auto mt-10 w-full max-w-6xl pb-6">
            {children}
          </main>
        </div>
      </div>

      {!isHomePage && <FAB />}
      <ProjectCreationPopup />
    </div>
  );
}
