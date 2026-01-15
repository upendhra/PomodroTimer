'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Bell, ChevronDown, ChevronUp, Minus, Palette, Plus, Quote, Watch, User, X, Music, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ThemeSettings from '@/components/settings/ThemeSettings';
import { createClient } from '@/lib/supabase/client';
import { useMusic } from '@/hooks/useMusic';

type QuoteCategory = 'drive' | 'uplift' | 'consistency' | 'love' | 'wisdom' | 'focus';

export type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown' | 'interval';
export type StayOnTaskFallback = 'focused' | 'deviated';
export type PomodoroDurationMode = 'default' | 'customised';
export type SettingsTabId = 'timer' | 'theme' | 'quotes' | 'clock' | 'account' | 'music';
type AlertTaskOption = { id: string; title: string };

interface MusicRow {
  id: string;
  name: string;
  audio_url: string;
  persona?: string;
}

interface Track {
  id: string;
  name: string;
  url: string;
  persona?: string;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  timerType: TimerMode;
  onTimerTypeChange: (mode: TimerMode) => void;
  stayOnTaskInterval: number;
  onStayOnTaskIntervalChange: (value: number) => void;
  stayOnTaskRepeat: boolean;
  onStayOnTaskRepeatChange: (value: boolean) => void;
  stayOnTaskModeSelected: boolean;
  onStayOnTaskModeSelected: (value: boolean) => void;
  stayOnTaskFallback: StayOnTaskFallback;
  onStayOnTaskFallbackChange: (value: StayOnTaskFallback) => void;
  alertTaskOptions: AlertTaskOption[];
  selectedAlertTaskId: string | null;
  selectedAlertTaskIds: string[];
  onAlertTaskSelect: (taskId: string) => void;
  onAlertTaskIdsSelect: (taskIds: string[]) => void;
  alertsEnabled: boolean;
  onAlertsEnabledChange: (value: boolean) => void;
  alertMode: 'common' | 'selective';
  onAlertModeChange: (mode: 'common' | 'selective') => void;
  initialTab?: SettingsTabId;
  tabFocusSignal?: number;
  focusAlertSectionSignal?: number;
  pomodoroDurationMode: PomodoroDurationMode;
  onPomodoroDurationModeChange: (mode: PomodoroDurationMode) => void;
  defaultFocusDuration: number;
  onDefaultFocusDurationChange: (value: number) => void;
  defaultShortBreak: number;
  onDefaultShortBreakChange: (value: number) => void;
  defaultLongBreak: number;
  onDefaultLongBreakChange: (value: number) => void;
  currentTaskDuration?: number; // Duration in minutes of the selected task
  onMusicSelect?: (track: Track) => void; // Callback when music is selected from settings
  musicCategoryResetSignal?: number; // Signal to reset music filter to "All"
  quotesEnabled?: boolean;
  onQuotesEnabledChange?: (enabled: boolean) => void;
  quoteLanguage?: 'english' | 'tamil';
  onQuoteLanguageChange?: (language: 'english' | 'tamil') => void;
  selectedQuoteCategory?: QuoteCategory;
  onSelectedQuoteCategoryChange?: (category: QuoteCategory) => void;
}

type QuoteContent = {
  text: string;
  author: string;
};

const QUOTE_CONTENT: Record<'english' | 'tamil', Record<QuoteCategory, QuoteContent>> = {
  english: {
    drive: {
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
      author: 'Winston Churchill',
    },
    uplift: {
      text: 'The future belongs to those who believe in the beauty of their dreams.',
      author: 'Eleanor Roosevelt',
    },
    consistency: {
      text: 'Success is the sum of small efforts, repeated day in and day out.',
      author: 'Robert Collier',
    },
    love: {
      text: 'Where there is love there is life.',
      author: 'Mahatma Gandhi',
    },
    wisdom: {
      text: 'The only true wisdom is in knowing you know nothing.',
      author: 'Socrates',
    },
    focus: {
      text: 'Concentrate all your thoughts upon the work at hand.',
      author: 'Elbert Hubbard',
    },
  },
  tamil: {
    drive: {
      text: 'முனைப்பே வெற்றியின் பாதையைத் திறக்கும் சக்தி.',
      author: 'அப்துல் கலாம்',
    },
    uplift: {
      text: 'உன்னை நீ நம்பினால், உன்னை உலகம் நம்பும்.',
      author: 'பகவத் கீதை',
    },
    consistency: {
      text: 'நிலைத்தன்மை தான் வெற்றியின் அமைதியான ஆயுதம்.',
      author: 'சிவானந்தர்',
    },
    love: {
      text: 'அன்பே உயிர்கள் பேசும் உண்மையான மொழி.',
      author: 'சுப்பிரமணிய பாரதி',
    },
    wisdom: {
      text: 'ஞானம் என்பது அனுபவத்தின் மூலம் வருகின்ற புதையல்.',
      author: 'திருவள்ளுவர்',
    },
    focus: {
      text: 'கவனம் என்பது வெற்றியின் திறவுகோல்.',
      author: 'புத்தர்',
    },
  },
};

const tabs = [
  { id: 'timer', label: 'Timer & Notification', icon: Bell },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'quotes', label: 'Proverbs', icon: Quote },
  { id: 'clock', label: 'Clock', icon: Watch },
  { id: 'account', label: 'Account', icon: User },
  { id: 'music', label: 'Music', icon: Music },
];

export default memo(function SettingsPanel({
  open,
  onClose,
  timerType,
  onTimerTypeChange,
  stayOnTaskInterval,
  onStayOnTaskIntervalChange,
  stayOnTaskRepeat,
  onStayOnTaskRepeatChange,
  stayOnTaskModeSelected,
  onStayOnTaskModeSelected,
  stayOnTaskFallback,
  onStayOnTaskFallbackChange,
  alertTaskOptions,
  selectedAlertTaskId,
  selectedAlertTaskIds,
  onAlertTaskSelect,
  onAlertTaskIdsSelect,
  alertsEnabled,
  onAlertsEnabledChange,
  alertMode,
  onAlertModeChange,
  initialTab,
  tabFocusSignal,
  focusAlertSectionSignal,
  pomodoroDurationMode,
  onPomodoroDurationModeChange,
  defaultFocusDuration,
  onDefaultFocusDurationChange,
  defaultShortBreak,
  onDefaultShortBreakChange,
  defaultLongBreak,
  onDefaultLongBreakChange,
  currentTaskDuration,
  onMusicSelect,
  musicCategoryResetSignal,
  quotesEnabled,
  onQuotesEnabledChange,
  quoteLanguage,
  onQuoteLanguageChange,
  selectedQuoteCategory,
  onSelectedQuoteCategoryChange,
}: SettingsPanelProps) {
  const resolvedQuoteLanguage: 'english' | 'tamil' = quoteLanguage ?? 'english';
  const resolvedQuoteCategory: QuoteCategory =
    selectedQuoteCategory ?? 'drive';
  const previewQuote = QUOTE_CONTENT[resolvedQuoteLanguage][resolvedQuoteCategory];
  const [activeTab, setActiveTab] = useState('timer');
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(true);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoCheckTasks, setAutoCheckTasks] = useState(true);
  const [sendCompletedToBottom, setSendCompletedToBottom] = useState(true);
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'study' | 'calm' | 'happy' | 'positive' | 'ambience'>('all');
  const alertTaskLabel =
    alertTaskOptions.find((task) => task.id === selectedAlertTaskId)?.title ||
    'No task selected';
  const [alertHighlight, setAlertHighlight] = useState(false);
  const alertSectionRef = useRef<HTMLDivElement | null>(null);
  const alertHighlightTimeoutRef = useRef<number | null>(null);
  const alertScrollFrameRef = useRef<number | null>(null);
  const selectClass =
    'settings-select w-full rounded-xl border border-white/25 bg-slate-950/70 px-3 py-2 text-sm text-white/90 shadow-[inset_0_1px_8px_rgba(15,23,42,0.65)] transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 focus:outline-none appearance-none';
  const supabase = createClient();
  const { selectedMusic, isPlaying, setMusic, play, pause } = useMusic();
  const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const handleNumberChange = (
    setter: (value: number) => void,
    min: number,
    max: number,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) return;
    setter(clampValue(parsed, min, max));
  };
  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number,
    max: number,
  ) => {
    setter((prev) => clampValue(prev + delta, min, max));
  };

  // Check if all required alert settings are complete
  // Allow closing if no tasks are available (alertTaskOptions.length === 0)
  // For selective mode, require at least one task selection; for common mode, don't require it
  const areAlertSettingsComplete = !alertsEnabled || 
    alertTaskOptions.length === 0 || 
    (
      (alertMode === 'common' || selectedAlertTaskIds.length > 0) &&
      stayOnTaskInterval > 0 &&
      stayOnTaskModeSelected
    );

  useEffect(() => {
    if (open) {
      setIsExpanded(true);
      return;
    }
    setIsExpanded(false);
    setAlertHighlight(false);
  }, [open]);

  useEffect(() => {
    if (!open || !initialTab) return;
    if (tabFocusSignal === undefined) return;
    setActiveTab(initialTab);
  }, [initialTab, tabFocusSignal, open]);

  useEffect(() => {
    if (!open || !focusAlertSectionSignal) return;
    onAlertsEnabledChange(true);

    alertScrollFrameRef.current = window.requestAnimationFrame(() => {
      alertSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setAlertHighlight(true);
      alertHighlightTimeoutRef.current = window.setTimeout(() => {
        setAlertHighlight(false);
        alertHighlightTimeoutRef.current = null;
      }, 2500);
    });

    return () => {
      if (alertScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(alertScrollFrameRef.current);
        alertScrollFrameRef.current = null;
      }
      if (alertHighlightTimeoutRef.current !== null) {
        window.clearTimeout(alertHighlightTimeoutRef.current);
        alertHighlightTimeoutRef.current = null;
      }
    };
  }, [focusAlertSectionSignal, open]);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase.from('music').select('id, name, audio_url, persona');
      if (!error) {
        setTracks(data.map((row: MusicRow) => ({ id: row.id, name: row.name, url: row.audio_url, persona: row.persona })));
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    if (!musicCategoryResetSignal) return;
    setSelectedCategory('all');
  }, [musicCategoryResetSignal]);

  const handlePreviewToggle = useCallback(async (track: Track) => {
    if (onMusicSelect) {
      console.log('🎵 Settings music selection:', track.name);
      onMusicSelect(track);
    } else {
      console.log('🎵 No onMusicSelect callback provided');
    }
  }, [onMusicSelect]);

  const categoryFilters: { label: string; value: 'all' | 'study' | 'calm' | 'happy' | 'positive' | 'ambience' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Study Mode', value: 'study' },
    { label: 'Calm', value: 'calm' },
    { label: 'Happy', value: 'happy' },
    { label: 'Positive', value: 'positive' },
    { label: 'Ambience', value: 'ambience' },
  ];

  const filteredTracks = tracks.filter(t => {
    if (selectedCategory === 'all') return true;
    if (!t.persona) return false;
    return t.persona.toLowerCase() === selectedCategory;
  });

  const handleStayOnTaskIntervalInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) return;
    
    // Auto-adjust very short intervals to minimum 30 seconds (0.5 minutes)
    const adjustedValue = parsed < 0.5 ? 0.5 : parsed;
    
    onStayOnTaskIntervalChange(clampValue(adjustedValue, 1, 60));
  };

  const adjustStayOnTaskInterval = (delta: number) => {
    const newValue = clampValue(stayOnTaskInterval + delta, 1, 60);
    // Auto-adjust if result would be too short
    const adjustedValue = newValue < 0.5 ? 0.5 : newValue;
    onStayOnTaskIntervalChange(adjustedValue);
  };

  return (
    <div className={`fixed inset-0 z-[60] ${open ? 'pointer-events-auto' : 'pointer-events-none'} transition-opacity duration-100 ${open ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-[0_-25px_60px_rgba(0,0,0,0.65)] transition-transform duration-100 ease-out ${
        open ? 'translate-y-0' : 'translate-y-full'
      } ${isExpanded ? 'h-[90vh]' : 'h-[65vh]'}`}>
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 opacity-30" />
          <div className="absolute inset-x-0 top-0 mx-auto h-1.5 w-16 rounded-full bg-white/20" />
          <div className="absolute inset-0 border border-white/5 opacity-20" />
        </div>

        {/* Drag handle + controls */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:border-white/40 hover:text-white"
            aria-label={isExpanded ? 'Collapse settings panel' : 'Expand settings panel'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {isExpanded ? 'Close up' : 'Slide up'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={!areAlertSettingsComplete}
            className={`rounded-full border p-2 transition ${!areAlertSettingsComplete ? 'border-red-400/50 bg-red-400/10 text-red-400 cursor-not-allowed opacity-50' : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 flex items-center justify-between px-6 pb-4">
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Play area</p>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex border-t border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-4 text-center transition ${
                  isActive
                    ? 'border-b-2 border-blue-400 bg-blue-400/10 text-blue-300'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="mx-auto mb-2 h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="settings-scrollbar relative z-10 flex-1 overflow-y-auto p-6">
          {activeTab === 'timer' && (
            <div className="space-y-6">
              {/* SECTION 1: Timer Configuration */}
              <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                    <Watch className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Timer Configuration</h3>
                    <p className="text-xs text-white/50">Set up your timer type and durations</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-white/80">Timer Type</label>
                    <div className="relative">
                      <select
                        className={`${selectClass} pr-10`}
                        value={timerType}
                        onChange={(event) => onTimerTypeChange(event.target.value as TimerMode)}
                      >
                        <option value="stopwatch">Stopwatch</option>
                        <option value="pomodoro">Pomodoro Timer</option>
                        <option value="countdown">Countdown Timer</option>
                        <option value="interval">Interval Timer</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                    </div>
                  </div>
                  {timerType === 'pomodoro' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Duration Mode</label>
                      <div className="inline-flex rounded-lg border border-white/20 bg-black/30 p-0.5">
                        <button
                          type="button"
                          onClick={() => onPomodoroDurationModeChange('default')}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                            pomodoroDurationMode === 'default'
                              ? 'bg-blue-500/80 text-white shadow'
                              : 'text-white/60 hover:text-white/80'
                          }`}
                        >
                          Default
                        </button>
                        <button
                          type="button"
                          onClick={() => onPomodoroDurationModeChange('customised')}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                            pomodoroDurationMode === 'customised'
                              ? 'bg-purple-500/80 text-white shadow'
                              : 'text-white/60 hover:text-white/80'
                          }`}
                        >
                          Customised
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {timerType === 'pomodoro' && pomodoroDurationMode === 'default' && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Focus Duration</label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultFocusDurationChange(Math.max(1, defaultFocusDuration - 5))}><Minus className="h-4 w-4" /></button>
                        <input type="number" value={defaultFocusDuration} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onDefaultFocusDurationChange(Math.min(120, Math.max(1, v))); }} className="w-16 bg-transparent text-center text-sm font-semibold outline-none" min={1} max={120} />
                        <span className="text-xs text-white/60">min</span>
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultFocusDurationChange(Math.min(120, defaultFocusDuration + 5))}><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Short Break</label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultShortBreakChange(Math.max(1, defaultShortBreak - 1))}><Minus className="h-4 w-4" /></button>
                        <input type="number" value={defaultShortBreak} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onDefaultShortBreakChange(Math.min(30, Math.max(1, v))); }} className="w-16 bg-transparent text-center text-sm font-semibold outline-none" min={1} max={30} />
                        <span className="text-xs text-white/60">min</span>
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultShortBreakChange(Math.min(30, defaultShortBreak + 1))}><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Long Break</label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultLongBreakChange(Math.max(5, defaultLongBreak - 5))}><Minus className="h-4 w-4" /></button>
                        <input type="number" value={defaultLongBreak} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onDefaultLongBreakChange(Math.min(60, Math.max(5, v))); }} className="w-16 bg-transparent text-center text-sm font-semibold outline-none" min={5} max={60} />
                        <span className="text-xs text-white/60">min</span>
                        <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onDefaultLongBreakChange(Math.min(60, defaultLongBreak + 5))}><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                )}
                {timerType === 'pomodoro' && pomodoroDurationMode === 'customised' && (
                  <div className="mt-4 rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
                    <p className="mb-3 text-xs font-medium text-purple-300">Each task can have its own timer duration:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-red-400"></div>
                        <span className="flex-1 text-sm text-white/80">Design homepage mockup</span>
                        <div className="flex items-center gap-1 rounded border border-white/20 bg-black/30 px-2 py-0.5">
                          <span className="text-xs font-semibold text-white/90">45</span>
                          <span className="text-[10px] text-white/50">min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                        <span className="flex-1 text-sm text-white/80">Review pull requests</span>
                        <div className="flex items-center gap-1 rounded border border-white/20 bg-black/30 px-2 py-0.5">
                          <span className="text-xs font-semibold text-white/90">20</span>
                          <span className="text-[10px] text-white/50">min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                        <span className="flex-1 text-sm text-white/80">Write documentation</span>
                        <div className="flex items-center gap-1 rounded border border-white/20 bg-black/30 px-2 py-0.5">
                          <span className="text-xs font-semibold text-white/90">30</span>
                          <span className="text-[10px] text-white/50">min</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] text-white/40">Set timer per task in the Task Board</p>
                  </div>
                )}
                {timerType === 'countdown' && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-white/80">Countdown (minutes)</label>
                    <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                      <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => adjustValue(setCountdownMinutes, -5, 1, 180)}><Minus className="h-4 w-4" /></button>
                      <input type="number" value={countdownMinutes} onChange={handleNumberChange(setCountdownMinutes, 1, 180)} className="w-16 bg-transparent text-center text-sm font-semibold outline-none" min={1} max={180} />
                      <span className="text-xs text-white/60">min</span>
                      <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => adjustValue(setCountdownMinutes, 5, 1, 180)}><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION 2: Pomodoro Automation (only for pomodoro timer) */}
              {timerType === 'pomodoro' && (
                <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Bell className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Pomodoro Automation</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-sm font-medium text-white whitespace-nowrap">Auto Start Breaks</p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoStartBreaks}
                        onClick={() => setAutoStartBreaks((prev) => !prev)}
                        className={`relative flex h-5 w-9 items-center rounded-full border border-white/15 px-0.5 transition ${autoStartBreaks ? 'bg-gradient-to-r from-emerald-400/70 to-cyan-400/70' : 'bg-white/5'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${autoStartBreaks ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-sm font-medium text-white whitespace-nowrap">Mark tasks complete</p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoCheckTasks}
                        onClick={() => setAutoCheckTasks((prev) => !prev)}
                        className={`relative flex h-5 w-9 items-center rounded-full border border-white/15 px-0.5 transition ${autoCheckTasks ? 'bg-gradient-to-r from-lime-400/70 to-emerald-400/70' : 'bg-white/5'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${autoCheckTasks ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-sm font-medium text-white whitespace-nowrap">Long break interval</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={2}
                          max={8}
                          value={longBreakInterval}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v)) setLongBreakInterval(Math.min(8, Math.max(2, v)));
                          }}
                          className="w-12 rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-center text-sm font-semibold text-white/90 focus:border-blue-400 focus:outline-none"
                        />
                        <span className="text-xs text-white/50">rounds</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 3: Alert Notifications */}
              <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                      <Bell className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Focus Alerts</h3>
                      <p className="text-xs text-white/50">Get nudges to stay on track</p>
                    </div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={alertsEnabled ?? false} onChange={(e) => onAlertsEnabledChange(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-white/70">Enable</span>
                  </label>
                </div>
                {!areAlertSettingsComplete && (
                  <div className="mb-4 rounded-lg border border-red-400/50 bg-red-400/10 p-3">
                    <p className="text-sm text-red-400">Please complete all settings</p>
                  </div>
                )}
                {alertsEnabled && (
                  <div ref={alertSectionRef} className={`space-y-4 rounded-xl border border-dashed border-white/15 bg-black/20 p-4 transition ${alertHighlight ? 'ring-2 ring-amber-300/70' : ''}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">Alert Mode</p>
                        <div className="flex gap-2">
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs transition hover:border-white/30 hover:bg-white/10">
                            <input
                              type="radio"
                              name="alertMode"
                              value="common"
                              checked={alertMode === 'common'}
                              onChange={(e) => onAlertModeChange(e.target.value as 'common' | 'selective')}
                              className="h-3.5 w-3.5 border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                            />
                            <span className="font-medium text-white">All Tasks</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs transition hover:border-white/30 hover:bg-white/10">
                            <input
                              type="radio"
                              name="alertMode"
                              value="selective"
                              checked={alertMode === 'selective'}
                              onChange={(e) => onAlertModeChange(e.target.value as 'common' | 'selective')}
                              className="h-3.5 w-3.5 border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                            />
                            <span className="font-medium text-white">Selective</span>
                          </label>
                        </div>
                      </div>
                      {alertMode === 'selective' && (
                        <div className="space-y-2">
                          <p className="text-xs text-white/50">Select tasks to apply alerts:</p>
                          <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2">
                            {alertTaskOptions.length === 0 ? (
                              <p className="text-xs text-white/40">No tasks available</p>
                            ) : (
                              alertTaskOptions.map((task) => (
                                <label key={task.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition hover:bg-white/5">
                                  <input
                                    type="checkbox"
                                    checked={selectedAlertTaskIds.includes(task.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onAlertTaskIdsSelect([...selectedAlertTaskIds, task.id]);
                                      } else {
                                        onAlertTaskIdsSelect(selectedAlertTaskIds.filter(id => id !== task.id));
                                      }
                                    }}
                                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="flex-1 text-white/90">{task.title}</span>
                                </label>
                              ))
                            )}
                          </div>
                          {selectedAlertTaskIds.length > 0 && (
                            <p className="text-xs text-emerald-400">
                              {selectedAlertTaskIds.length} task{selectedAlertTaskIds.length > 1 ? 's' : ''} selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Alert frequency</label>
                          <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                            <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onStayOnTaskIntervalChange(Math.max(0, stayOnTaskInterval - 1))}><Minus className="h-4 w-4" /></button>
                            <input type="number" value={stayOnTaskInterval} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onStayOnTaskIntervalChange(Math.min(30, Math.max(0, v))); }} className="w-16 bg-transparent text-center text-sm font-semibold outline-none" min={0} max={30} />
                            <span className="text-xs text-white/60">min</span>
                            <button type="button" className="rounded-full p-1 text-white/70 transition hover:bg-white/10" onClick={() => onStayOnTaskIntervalChange(Math.min(30, stayOnTaskInterval + 1))}><Plus className="h-4 w-4" /></button>
                          </div>
                          {alertsEnabled && stayOnTaskInterval === 0 && (
                            <p className="mt-1 text-xs text-red-400">
                              Alert frequency must be greater than 0 minutes
                            </p>
                          )}
                          {currentTaskDuration && stayOnTaskInterval >= currentTaskDuration && (
                            <p className="mt-1 text-xs text-red-400">
                              Alert frequency ({stayOnTaskInterval} min) must be less than task duration ({currentTaskDuration} min)
                            </p>
                          )}
                          <p className="mt-1 text-xs text-white/50">How often to remind you</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { onStayOnTaskModeSelected(true); onStayOnTaskRepeatChange(true); }} className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${stayOnTaskModeSelected && stayOnTaskRepeat ? 'border-emerald-400/50 bg-emerald-400/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}>
                            <p className="font-semibold">Repeat</p>
                            <p className="text-white/50">Every interval</p>
                          </button>
                          <button type="button" onClick={() => { onStayOnTaskModeSelected(true); onStayOnTaskRepeatChange(false); }} className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${stayOnTaskModeSelected && !stayOnTaskRepeat ? 'border-sky-400/50 bg-sky-400/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}>
                            <p className="font-semibold">Once</p>
                            <p className="text-white/50">First reminder only</p>
                          </button>
                        </div>
                        {alertsEnabled && !stayOnTaskModeSelected && (
                          <p className="text-xs text-red-400">
                            Please select Repeat or Once
                          </p>
                        )}
                      </div>
                      <div className={`space-y-3 ${stayOnTaskModeSelected ? '' : 'pointer-events-none opacity-40'}`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">If I don't respond</p>
                        <p className="text-xs text-white/50">{stayOnTaskModeSelected ? 'Choose automatic answer when you skip check-in' : 'Select a reminder style first'}</p>
                        <div className="flex gap-2">
                          {(['focused', 'deviated'] as StayOnTaskFallback[]).map((opt) => (
                            <button key={opt} type="button" onClick={() => onStayOnTaskFallbackChange(opt)} className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${stayOnTaskFallback === opt ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}>
                              <p className="font-semibold capitalize">{opt}</p>
                              <p className="text-white/50">{opt === 'focused' ? 'Mark as on track' : 'Log as deviated'}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'theme' && <ThemeSettings />}

          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Proverb Settings</h3>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Proverb Display
                    </label>
                    <select className={selectClass}>
                      <option value="random">Random proverbs</option>
                      <option value="motivational">Motivational only</option>
                      <option value="custom">Custom proverbs</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-sm text-white/80">Show proverbs during breaks</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clock' && (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-white">Clock Settings</h3>
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 shadow-inner">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80">
                  <Watch className="h-6 w-6" />
                </div>
                <p className="text-2xl font-semibold text-white">Coming soon</p>
                <p className="mt-2 text-sm text-white/70">
                  We’re crafting advanced clock controls and personalization. Stay tuned!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Profile Picture
                  </label>
                  <button className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-left text-white hover:border-white/50">
                    Change avatar
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                    defaultValue="User"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                    defaultValue="user@example.com"
                  />
                </div>
                <button className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                    <Music className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Music Playlist</h3>
                    <p className="text-xs text-white/50">View your remote music tracks</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-white/80">Filter by Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.map((filter) => {
                      const isActive = selectedCategory === filter.value;
                      return (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setSelectedCategory(filter.value)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            isActive
                              ? 'border-purple-400 bg-purple-500/30 text-white shadow'
                              : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h4 className="mb-3 text-sm font-medium text-white">Playlist</h4>
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {filteredTracks.length === 0 ? (
                      <p className="text-sm text-white/50">No tracks found.</p>
                    ) : (
                      <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredTracks.map(track => (
                          <button
                            type="button"
                            key={track.id}
                            onClick={() => handlePreviewToggle(track)}
                            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition ${
                              selectedMusic?.id === track.id && isPlaying
                                ? 'border-purple-400/70 bg-purple-500/20'
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                            }`}
                          >
                            <span className="text-white/70">
                              {selectedMusic?.id === track.id && isPlaying ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="flex-1 truncate font-medium text-white/90 text-left">{track.name}</span>
                            {track.persona && (
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/60">
                                {track.persona}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
                    <Quote className="h-4 w-4 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Proverbs</h3>
                    <p className="text-xs text-white/50">Display inspirational proverbs in your play area</p>
                  </div>
                </div>

                {/* Proverbs On/Off Toggle */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Show Proverbs</p>
                    <p className="text-xs text-white/50">Display proverbs during focus sessions</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={quotesEnabled}
                    onClick={() => onQuotesEnabledChange?.(!quotesEnabled)}
                    className={`relative flex h-6 w-11 items-center rounded-full border border-white/15 px-0.5 transition ${quotesEnabled ? 'bg-gradient-to-r from-rose-400/70 to-pink-400/70' : 'bg-white/5'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${quotesEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-white/80">Language</p>
                    <p className="text-xs text-white/50">Choose the language for your proverbs</p>
                  </div>
                  <div className="inline-flex rounded-lg border border-white/20 bg-black/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => onQuoteLanguageChange?.('english')}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition ${quoteLanguage === 'english' ? 'bg-rose-500/80 text-white shadow' : 'text-white/60 hover:text-white/80'}`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuoteLanguageChange?.('tamil')}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition ${quoteLanguage === 'tamil' ? 'bg-rose-500/80 text-white shadow' : 'text-white/60 hover:text-white/80'}`}
                    >
                      தமிழ் (Tamil)
                    </button>
                  </div>
                </div>

                {/* Proverb Category Selection (show for both languages) */}
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-white/80">Category</p>
                    <p className="text-xs text-white/50">Select the type of proverbs to display</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(quoteLanguage === 'tamil' ? [
                      { value: 'drive' as const, label: 'முனைப்பு', english: 'Drive' },
                      { value: 'uplift' as const, label: 'உயர்வு', english: 'Uplift' },
                      { value: 'consistency' as const, label: 'நிலைத்தன்மை', english: 'Consistency' },
                      { value: 'love' as const, label: 'அன்பு', english: 'Love' },
                      { value: 'wisdom' as const, label: 'ஞானம்', english: 'Wisdom' },
                      { value: 'focus' as const, label: 'கவனம்', english: 'Focus' },
                    ] : [
                      { value: 'drive' as const, label: 'Drive', english: 'Drive' },
                      { value: 'uplift' as const, label: 'Uplift', english: 'Uplift' },
                      { value: 'consistency' as const, label: 'Consistency', english: 'Consistency' },
                      { value: 'love' as const, label: 'Love', english: 'Love' },
                      { value: 'wisdom' as const, label: 'Wisdom', english: 'Wisdom' },
                      { value: 'focus' as const, label: 'Focus', english: 'Focus' },
                    ]).map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => onSelectedQuoteCategoryChange?.(category.value)}
                        className={`inline-flex min-w-[110px] flex-col items-center rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                          selectedQuoteCategory === category.value
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span className="text-white/90 font-semibold leading-tight">{category.label}</span>
                        {quoteLanguage === 'tamil' && (
                          <span className="text-[9px] text-white/50 leading-tight">{category.english}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote Preview */}
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <h4 className="mb-3 text-sm font-medium text-white">Preview</h4>
                  <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4">
                    <blockquote className="text-center">
                      <p className="text-sm font-medium text-white/90 italic">
                        {previewQuote.text}
                      </p>
                      <cite className="mt-2 block text-xs text-white/60">
                        — {previewQuote.author}
                      </cite>
                    </blockquote>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
