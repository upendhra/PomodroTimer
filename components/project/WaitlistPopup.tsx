'use client';

import { X } from 'lucide-react';
import { useProjectCreation } from '@/hooks/useProjectCreation';

interface WaitlistPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistPopup({ isOpen, onClose }: WaitlistPopupProps) {
  const handleJoinWaitlist = () => {
    // For now, just close the popup
    // In the future, this could collect email or other info
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-[2px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Project Limit Reached
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <p className="text-white/80" style={{ fontFamily: "'Manrope', sans-serif" }}>
            You've reached the maximum of 2 projects for the free tier.
          </p>
          <p className="text-white/70 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Join our waitlist to get notified when we expand project limits or release premium features.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleJoinWaitlist}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Join Waitlist
        </button>
      </div>
    </div>
  );
}
