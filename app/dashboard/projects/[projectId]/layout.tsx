'use client';

import { type ReactNode } from "react";
import ProjectCreationPopup from "@/components/project/ProjectCreationPopup";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {children}
      <ProjectCreationPopup />
    </div>
  );
}
