'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type DurationType = 'date_range' | 'daily';

export interface ProjectFormData {
  projectName: string;
  durationType: DurationType;
  startDate: string;
  endDate: string;
  plannedHours: Record<string, number>;
}

interface ProjectCreationState {
  // Modal state
  isOpen: boolean;
  currentStep: 1 | 2;
  isSubmitting: boolean;

  // Form data
  formData: ProjectFormData;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  resetForm: () => void;

  // Step navigation
  nextStep: () => void;
  prevStep: () => void;

  // Form updates
  updateProjectName: (name: string) => void;
  updateDurationType: (type: DurationType) => void;
  updateStartDate: (date: string) => void;
  updateEndDate: (date: string) => void;
  updatePlannedHours: (key: string, hours: number) => void;

  // Submission
  submitProject: () => Promise<string | null>; // Returns project ID or null on error
  submitAndNavigate: (router: any) => Promise<void>;
}

const initialFormData: ProjectFormData = {
  projectName: '',
  durationType: 'date_range',
  startDate: '',
  endDate: '',
  plannedHours: {},
};

export const useProjectCreation = create<ProjectCreationState>((set, get) => ({
  // Initial state
  isOpen: false,
  currentStep: 1,
  isSubmitting: false,
  formData: { ...initialFormData },

  // Modal actions
  openModal: () => set({ isOpen: true, currentStep: 1, formData: { ...initialFormData } }),
  closeModal: () => set({ isOpen: false }),
  resetForm: () => set({ formData: { ...initialFormData }, currentStep: 1 }),

  // Step navigation
  nextStep: () => set((state) => ({
    currentStep: state.currentStep === 1 ? 2 : state.currentStep
  })),
  prevStep: () => set((state) => ({
    currentStep: state.currentStep === 2 ? 1 : state.currentStep
  })),

  // Form updates
  updateProjectName: (projectName) => set((state) => ({
    formData: { ...state.formData, projectName }
  })),

  updateDurationType: (durationType) => set((state) => ({
    formData: { ...state.formData, durationType }
  })),

  updateStartDate: (startDate) => set((state) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let adjustedStartDate = startDate;
    if (new Date(startDate) < today) {
      adjustedStartDate = todayStr;
    }
    let newFormData = { ...state.formData, startDate: adjustedStartDate };
    if (newFormData.endDate) {
      const start = new Date(adjustedStartDate);
      const end = new Date(newFormData.endDate);
      const maxEnd = new Date(start);
      maxEnd.setMonth(maxEnd.getMonth() + 6);
      if (end > maxEnd) {
        newFormData.endDate = maxEnd.toISOString().split('T')[0];
      }
      if (end < start) {
        newFormData.endDate = adjustedStartDate;
      }
    }
    return { formData: newFormData };
  }),

  updateEndDate: (endDate) => set((state) => {
    let newFormData = { ...state.formData, endDate };
    if (newFormData.startDate) {
      const start = new Date(newFormData.startDate);
      const end = new Date(endDate);
      const maxEnd = new Date(start);
      maxEnd.setMonth(maxEnd.getMonth() + 6);
      if (end > maxEnd) {
        newFormData.endDate = maxEnd.toISOString().split('T')[0];
      }
      if (end < start) {
        newFormData.endDate = newFormData.startDate;
      }
    }
    return { formData: newFormData };
  }),

  updatePlannedHours: (key, hours) => set((state) => ({
    formData: {
      ...state.formData,
      plannedHours: { ...state.formData.plannedHours, [key]: hours }
    }
  })),

  // Submission
  submitProject: async () => {
    const state = get();
    console.log('=== SUBMIT PROJECT STARTED ===');
    console.log('Submitting project with form data:', state.formData);

    if (!state.formData.projectName.trim()) {
      console.error('Project name is required');
      return null;
    }

    set({ isSubmitting: true });

    try {
      console.log('Getting authenticated user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        return null;
      }
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }
      console.log('User authenticated:', user.id);

      // Prepare data for Supabase
      const { formData } = state;
      
      // Compute planned_hours based on duration_type
      let computedPlannedHours = { ...formData.plannedHours };
      if (formData.durationType === 'date_range' && formData.plannedHours['perDay'] !== undefined) {
        // Generate dates between start and end
        const dates: string[] = [];
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const current = new Date(startDate);
        while (current <= endDate) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        // Set each date to the perDay value
        computedPlannedHours = {};
        dates.forEach(date => {
          computedPlannedHours[date] = Number(formData.plannedHours['perDay']) || 0;
        });
      }
      
      // Validate and format data
      const projectData = {
        user_id: user.id,
        project_name: formData.projectName.trim(),
        duration_type: formData.durationType,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        planned_hours: computedPlannedHours,
        status: 'active'
      };

      // Additional validation
      if (projectData.duration_type === 'date_range') {
        if (!projectData.start_date || !projectData.end_date) {
          console.error('Date range requires both start and end dates');
          return null;
        }
      }

      // Ensure dates are in correct format (YYYY-MM-DD)
      if (projectData.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(projectData.start_date)) {
        console.error('Invalid start_date format:', projectData.start_date);
        return null;
      }
      if (projectData.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(projectData.end_date)) {
        console.error('Invalid end_date format:', projectData.end_date);
        return null;
      }

      console.log('Inserting project data:', projectData);

      // Insert project
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id');

      console.log('Supabase insert result:', { data, error });

      if (error) {
        console.error('Supabase insert failed!');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', error);
        console.error('Attempted to insert:', projectData);
        return null;
      }

      // Handle the return value - data is an array from insert().select()
      let projectId = null;
      if (data && Array.isArray(data) && data.length > 0) {
        projectId = data[0].id;
      }

      if (!projectId) {
        console.error('Insert succeeded but no project ID returned. Data:', data);
        console.error('Attempted to insert:', projectData);
        return null;
      }

      console.log('Project created successfully with ID:', projectId);

      // Verify the project was created by fetching it
      const { data: verifyData, error: verifyError } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('id', projectId)
        .single();

      if (verifyError || !verifyData) {
        console.error('Project creation verification failed:', { verifyError, verifyData });
        return null;
      }

      console.log('Project creation verified successfully:', verifyData);
      return projectId;

    } catch (err) {
      console.error('Unexpected error during submission:', err);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  submitAndNavigate: async (router: any) => {
    const projectId = await get().submitProject();
    if (projectId) {
      // Reset form and close modal
      set({ isOpen: false, formData: { ...initialFormData }, currentStep: 1 });
      // Navigate
      router.push(`/dashboard/projects/${projectId}`);
    } else {
      // Still close modal on error, but don't navigate
      set({ isOpen: false });
      // Maybe show error toast here in the future
      console.error('Failed to create project - check authentication and form data');
    }
  },
}));
