"use client";

import { useRef } from "react";
import { Bold, Italic, Underline, X } from "lucide-react";

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  onChange: (html: string) => void;
}

const toolbarButtons = [
  { label: "Bold", command: "bold", icon: Bold },
  { label: "Italic", command: "italic", icon: Italic },
  { label: "Underline", command: "underline", icon: Underline },
];

export default function QuickNoteModal({ open, onClose, content, onChange }: QuickNoteModalProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const handleCommand = (command: string) => {
    document.execCommand(command);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div
      className={`pointer-events-none absolute top-[5.5rem] right-6 z-30 transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="pointer-events-auto w-[280px] rounded-3xl border border-white/15 bg-gradient-to-br from-[#162544]/85 via-[#1f2141]/85 to-[#2b1940]/90 p-4 text-white shadow-2xl backdrop-blur-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/15 text-sm font-semibold">✍️</span>
            <div>
              <p className="text-xs font-medium text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quick Note</p>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Pocket Pad
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close notes"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 p-1.5 text-white transition hover:bg-white/25"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 p-2">
          {toolbarButtons.map(({ label, command, icon: Icon }) => (
            <button
              key={command}
              type="button"
              aria-label={label}
              onClick={() => handleCommand(command)}
              className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/25"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="min-h-[140px] rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          style={{ fontFamily: "'Manrope', sans-serif" }}
          dangerouslySetInnerHTML={{ __html: content || "<p>Write your reflections...</p>" }}
        />
      </div>
    </div>
  );
}
