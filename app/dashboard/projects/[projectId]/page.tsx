'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import WelcomeCard from '@/components/project/WelcomeCard';
import EnterPlayButton from '@/components/project/EnterPlayButton';
import ProjectStats from '@/components/project/ProjectStats';
import MusicDrawer from '@/components/project/MusicDrawer';
import CalendarDrawer from '@/components/project/CalendarDrawer';
import QuickNoteModal from '@/components/project/QuickNoteModal';
import ProjectInsightsPanel from '@/components/project/ProjectInsightsPanel';
import ProjectViewSwitch from '@/components/project/ProjectViewSwitch';
import { ArrowLeft, Music, CalendarDays, NotebookPen, BarChart3 } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number>;
}

export default function ProjectHomeBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.projectId === 'string' ? params.projectId : null;
  const cacheKey = projectId ? `projectHome:${projectId}` : null;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [isMusicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isNoteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('<p>Write your reflections...</p>');
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    async function getProject() {
      console.log('🔍 [PROJECT PAGE] useEffect triggered');
      console.log('📋 [PROJECT PAGE] params.projectId:', params.projectId);
      console.log('📋 [PROJECT PAGE] typeof params.projectId:', typeof params.projectId);
      
      if (!params.projectId || typeof params.projectId !== 'string') {
        console.error('❌ [PROJECT PAGE] Invalid project ID');
        setError('Invalid project ID');
        setLoading(false);
        return;
      }

      console.log('=== GET PROJECT STARTED (CLIENT-SIDE) ===');
      console.log('📂 [PROJECT PAGE] Fetching project with ID:', params.projectId);

      try {
        const supabase = createClient();
        // Get authenticated user
        console.log('🔐 [PROJECT PAGE] Calling supabase.auth.getUser()...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        console.log('🔐 [PROJECT PAGE] Auth response:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          hasError: !!userError,
          errorMessage: userError?.message,
          errorStatus: userError?.status,
        });

        if (userError || !user) {
          console.error('❌ [PROJECT PAGE] Auth failed - BUT NOT REDIRECTING (temporarily disabled for debugging)');
          console.error('❌ [PROJECT PAGE] userError:', userError);
          console.error('❌ [PROJECT PAGE] user:', user);
          console.log('⚠️ [PROJECT PAGE] Would redirect to /auth/login but skipping for now...');
          // TEMPORARY: Commenting out redirect to debug
          // window.location.href = '/auth/login';
          // return;
        }

        if (!user) {
          console.error('❌ [PROJECT PAGE] No user found after auth check');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('✅ [PROJECT PAGE] User authenticated successfully');
        console.log('📊 [PROJECT PAGE] Fetching project from database...');

        // Fetch project
        const { data, error } = await supabase
          .from('projects')
          .select('id, project_name, duration_type, start_date, end_date, weekdays, planned_hours')
          .eq('id', params.projectId)
          .eq('user_id', user.id)
          .single();

        console.log('📊 [PROJECT PAGE] Supabase query result:', {
          hasData: !!data,
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code,
          projectId: data?.id,
          projectName: data?.project_name,
        });

        if (error || !data) {
          console.error('❌ [PROJECT PAGE] Project not found or query failed');
          console.error('❌ [PROJECT PAGE] error:', error);
          setError('Project not found');
          setLoading(false);
          return;
        }

        console.log('✅ [PROJECT PAGE] Project fetched successfully:', data.project_name);
        setProject(data);
        router.replace(`/dashboard/projects/${params.projectId}/play`);
        setHasRedirected(true);
        
        if (cacheKey && typeof window !== 'undefined') {
          console.log('💾 [PROJECT PAGE] Caching project data with key:', cacheKey);
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
            console.log('✅ [PROJECT PAGE] Project data cached successfully');
          } catch (cacheError) {
            console.warn('⚠️ [PROJECT PAGE] Unable to cache project home data', cacheError);
          }
        }
      } catch (err) {
        console.error('❌ [PROJECT PAGE] Error fetching project:', err);
        console.error('❌ [PROJECT PAGE] Error stack:', (err as Error).stack);
        setError('Failed to load project');
      } finally {
        console.log('🏁 [PROJECT PAGE] getProject() completed, setLoading(false)');
        setLoading(false);
      }
    }

    getProject();
  }, [params.projectId, cacheKey]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-green-900 via-blue-900 to-emerald-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (hasRedirected) {
    return null;
  }

  if (error || !project) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-green-900 via-blue-900 to-emerald-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-white/80 mb-6">{error || 'The project you\'re looking for doesn\'t exist or you don\'t have access to it.'}</p>
          <a
            href="/dashboard/home"
            className="px-6 py-3 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg text-white font-medium hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate w-full h-screen text-white overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#0f172a]/70 to-[#1a1f2f]/90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-emerald-500/10 mix-blend-screen"></div>
      </div>
      <Link
        href="/dashboard/home"
        aria-label="Back to dashboard"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Exit</span>
      </Link>
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <button
          type="button"
          aria-label="Project insights"
          onClick={() => setStatsOpen((prev) => !prev)}
          className={`rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition backdrop-blur-md hover:bg-white/20 ${
            isStatsOpen ? 'border-amber-300/70 bg-amber-400/10 shadow-[0_0_30px_rgba(251,191,36,0.35)]' : ''
          }`}
        >
          <BarChart3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Music control"
          onClick={() => setMusicDrawerOpen((prev) => !prev)}
          className={`rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition backdrop-blur-md hover:bg-white/20 ${
            isMusicDrawerOpen ? 'border-emerald-300/60 bg-emerald-400/10' : ''
          }`}
        >
          <Music className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Calendar"
          onClick={() => setCalendarOpen((prev) => !prev)}
          className={`rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition backdrop-blur-md hover:bg-white/20 ${
            isCalendarOpen ? 'border-cyan-300/60 bg-cyan-400/10' : ''
          }`}
        >
          <CalendarDays className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Notes"
          onClick={() => setNoteOpen(true)}
          className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20 backdrop-blur-md"
        >
          <NotebookPen className="h-5 w-5" />
        </button>
      </div>
      <ProjectInsightsPanel open={isStatsOpen} project={project} />
      <MusicDrawer
        open={isMusicDrawerOpen}
        onClose={() => setMusicDrawerOpen(false)}
        currentTrackId={currentTrackId}
        positionClass="absolute right-[7.5rem] top-24"
        onTrackSelect={(track) => {
          setCurrentTrackId(track?.id ?? null);
          setCurrentTrackTitle(track?.title ?? null);
        }}
      />
      <CalendarDrawer
        open={isCalendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
      <QuickNoteModal
        open={isNoteOpen}
        onClose={() => setNoteOpen(false)}
        content={noteContent}
        onChange={setNoteContent}
      />
      {/* Nature Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 right-10 w-64 h-64 rounded-full bg-white/10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-emerald-400/20 blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-full h-screen px-6 py-12">
        <div className="flex flex-col items-center gap-12 max-w-5xl w-full">
          <ProjectViewSwitch
            projectId={project.id}
            activeView="home"
            className="self-center"
          />
          <WelcomeCard projectName={project.project_name} />
          <ProjectStats project={project} />
          <EnterPlayButton projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
