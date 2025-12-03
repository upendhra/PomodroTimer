"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectCreation } from "@/hooks/useProjectCreation";

const menuItems = [
  { label: "Create Project", action: () => useProjectCreation.getState().openModal() },
  { label: "Log Focus Burst" },
];

export default function FAB() {
  const [open, setOpen] = useState(false);

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-8 z-50 flex items-end justify-center sm:justify-end sm:px-8 md:px-12">
      <div className="relative flex flex-col items-center gap-3 sm:items-end">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden rounded-3xl border border-white/15 bg-[rgba(6,4,24,0.82)] backdrop-blur-2xl px-4 py-3 text-sm text-white/80 shadow-[0_20px_55px_rgba(3,4,15,0.65)]"
            >
              {menuItems.map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => handleItemClick({ label, action })}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#82f2ff] to-[#f4b2ff] shadow-[0_0_12px_rgba(130,242,255,0.8)]" />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle cosmic actions"
          className={`relative flex h-16 w-16 items-center justify-center rounded-full text-3xl font-semibold text-white transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#82f2ff]/50 ${open ? "scale-110" : ""}`}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#82f2ff] via-[#b57aff] to-[#f4b2ff] shadow-[0_20px_70px_rgba(5,8,30,0.65)]" />
          <span className="absolute inset-[2px] rounded-full border border-white/30" />
          <span className="relative">+</span>
        </button>
      </div>
    </div>
  );
}
