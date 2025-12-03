'use client';

import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import ProjectCreationStep1 from './ProjectCreationStep1';
import ProjectCreationStep2 from './ProjectCreationStep2';

export default function ProjectCreationPopup() {
  const router = useRouter();
  const {
    isOpen,
    currentStep,
    isSubmitting,
    nextStep,
    prevStep,
    submitAndNavigate
  } = useProjectCreation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await submitAndNavigate(router);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-[2px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Create Project
          </h2>
          <button
            onClick={() => useProjectCreation.getState().closeModal()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-[#82f2ff] text-black' : 'bg-white/20 text-white/60'}`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-[#82f2ff]' : 'bg-white/20'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-[#82f2ff] text-black' : 'bg-white/20 text-white/60'}`}>
            2
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 ? <ProjectCreationStep1 /> : <ProjectCreationStep2 />}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentStep === 2 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {currentStep === 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-3 bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#82f2ff]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
