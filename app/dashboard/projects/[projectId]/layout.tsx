'use client';

import { type ReactNode } from "react";
import ProjectCreationPopup from "@/components/project/ProjectCreationPopup";
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="relative isolate min-h-screen overflow-hidden">
        {children}
        <ProjectCreationPopup />
      </div>
    </ThemeProvider>
  );
}
