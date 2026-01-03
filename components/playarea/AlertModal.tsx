'use client';

import { useEffect, useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onResponse: (response: 'focused' | 'deviated') => void;
  defaultResponse: 'focused' | 'deviated';
  taskName: string;
}

export default function FocusAlertModal({ isOpen, onResponse, defaultResponse, taskName }: AlertModalProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer); // Stop the timer
            return 0; // Set to 0 to trigger auto-response
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Reset countdown when modal closes
      setCountdown(30);
    }
  }, [isOpen]);

  // Separate effect to handle auto-response when countdown reaches 0
  useEffect(() => {
    if (isOpen && countdown === 0) {
      onResponse(defaultResponse);
    }
  }, [isOpen, countdown, defaultResponse, onResponse]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-white">Focus Check</h2>
          <p className="text-sm text-white/70">{taskName}</p>
        </div>

        {/* Question */}
        <div className="mb-6 text-center">
          <p className="text-xl font-medium text-white">Are you Focused or Deviated?</p>
        </div>

        {/* Countdown */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-white">
              Auto-select in {countdown}s
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onResponse('focused')}
            className="flex-1 rounded-lg border border-emerald-400/50 bg-emerald-400/10 py-3 text-sm font-medium text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-400/20"
          >
            Focused
          </button>
          <button
            onClick={() => onResponse('deviated')}
            className="flex-1 rounded-lg border border-red-400/50 bg-red-400/10 py-3 text-sm font-medium text-red-400 transition hover:border-red-400 hover:bg-red-400/20"
          >
            Deviated
          </button>
        </div>
      </div>
    </div>
  );
}
