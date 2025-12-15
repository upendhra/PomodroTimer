'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { Bell, ChevronDown, ChevronUp, Minus, Palette, Plus, Quote, Watch, User, X } from 'lucide-react';

export type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown' | 'interval';
export type StayOnTaskFallback = 'focused' | 'deviated';
export type SettingsTabId = 'timer' | 'theme' | 'quotes' | 'clock' | 'account';
type AlertTaskOption = { id: string; title: string };

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
  onAlertTaskSelect: (taskId: string) => void;
  initialTab?: SettingsTabId;
  tabFocusSignal?: number;
  focusAlertSectionSignal?: number;
}

const tabs = [
  { id: 'timer', label: 'Timer & Notification', icon: Bell },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'quotes', label: 'Quotes', icon: Quote },
  { id: 'clock', label: 'Clock', icon: Watch },
  { id: 'account', label: 'Account', icon: User },
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
  onAlertTaskSelect,
  initialTab,
  tabFocusSignal,
  focusAlertSectionSignal,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('timer');
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const alertTaskLabel =
    alertTaskOptions.find((task) => task.id === selectedAlertTaskId)?.title ||
    alertTaskOptions[0]?.title ||
    'Current Task';
  const [alertHighlight, setAlertHighlight] = useState(false);
  const alertSectionRef = useRef<HTMLDivElement | null>(null);
  const alertHighlightTimeoutRef = useRef<number | null>(null);
  const alertScrollFrameRef = useRef<number | null>(null);
  const selectClass =
    'settings-select w-full rounded-xl border border-white/25 bg-slate-950/70 px-3 py-2 text-sm text-white/90 shadow-[inset_0_1px_8px_rgba(15,23,42,0.65)] transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 focus:outline-none appearance-none';
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
    setAlertsEnabled(true);

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

  const handleStayOnTaskIntervalInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) return;
    onStayOnTaskIntervalChange(clampValue(parsed, 1, 60));
  };

  const adjustStayOnTaskInterval = (delta: number) => {
    onStayOnTaskIntervalChange(clampValue(stayOnTaskInterval + delta, 1, 60));
  };

  return (
    <div className={`fixed inset-0 z-[60] ${open ? 'pointer-events-auto' : 'pointer-events-none'} transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-[0_-25px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-transform duration-200 ease-out ${
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
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/50 hover:text-white"
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
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          {activeTab === 'timer' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Timer Settings</h3>
              <div className="flex flex-wrap gap-4">
                <div className="w-[240px]">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Timer Type
                  </label>
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
                  <div className="grid w-full max-w-[580px] grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Focus Duration
                      </label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setFocusDuration, -5, 5, 120)}
                          aria-label="Decrease focus duration"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={focusDuration}
                          onChange={handleNumberChange(setFocusDuration, 5, 120)}
                          className="w-16 bg-transparent text-center text-sm font-semibold outline-none"
                          min={5}
                          max={120}
                        />
                        <span className="text-xs text-white/60">min</span>
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setFocusDuration, 5, 5, 120)}
                          aria-label="Increase focus duration"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Short Break
                      </label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setShortBreak, -1, 2, 30)}
                          aria-label="Decrease short break"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={shortBreak}
                          onChange={handleNumberChange(setShortBreak, 2, 30)}
                          className="w-16 bg-transparent text-center text-sm font-semibold outline-none"
                          min={2}
                          max={30}
                        />
                        <span className="text-xs text-white/60">min</span>
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setShortBreak, 1, 2, 30)}
                          aria-label="Increase short break"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Long Break
                      </label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setLongBreak, -5, 5, 60)}
                          aria-label="Decrease long break"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={longBreak}
                          onChange={handleNumberChange(setLongBreak, 5, 60)}
                          className="w-16 bg-transparent text-center text-sm font-semibold outline-none"
                          min={5}
                          max={60}
                        />
                        <span className="text-xs text-white/60">min</span>
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setLongBreak, 5, 5, 60)}
                          aria-label="Increase long break"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {timerType === 'countdown' && (
                  <div className="flex flex-wrap gap-4">
                    <div className="w-[200px]">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Countdown (minutes)
                      </label>
                      <div className="inline-flex items-center rounded-2xl border border-white/20 bg-black/40 px-2 py-1.5 text-white shadow-inner">
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setCountdownMinutes, -5, 1, 180)}
                          aria-label="Decrease countdown"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={countdownMinutes}
                          onChange={handleNumberChange(setCountdownMinutes, 1, 180)}
                          className="w-16 bg-transparent text-center text-sm font-semibold outline-none"
                          min={1}
                          max={180}
                        />
                        <span className="text-xs text-white/60">min</span>
                        <button
                          type="button"
                          className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                          onClick={() => adjustValue(setCountdownMinutes, 5, 1, 180)}
                          aria-label="Increase countdown"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="w-full max-w-[580px] space-y-3">
                  <label className="inline-flex items-center gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={alertsEnabled}
                      onChange={(event) => setAlertsEnabled(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                    />
                    Enable Alert Interval
                  </label>
                  {alertsEnabled && (
                    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
                          Alert Settings for:
                        </p>
                        <div className="relative w-full sm:w-52">
                          <select
                            className={`${selectClass} pr-10 text-sm`}
                            value={selectedAlertTaskId ?? ''}
                            onChange={(event) => onAlertTaskSelect(event.target.value)}
                          >
                            {alertTaskOptions.length === 0 ? (
                              <option value="">No tasks available</option>
                            ) : (
                              alertTaskOptions.map((task) => (
                                <option key={task.id} value={task.id}>
                                  {task.title}
                                </option>
                              ))
                            )}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                      </div>
                      <p className="text-xs text-white/60">
                        Viewing settings for: <span className="font-semibold text-white/80">{alertTaskLabel}</span>
                      </p>
                    </div>
                  )}
                </div>
                {alertsEnabled && (
                  <div
                    ref={alertSectionRef}
                    className={`w-full max-w-[580px] space-y-4 rounded-2xl border border-dashed border-white/20 bg-white/5/20 p-4 text-white transition ${
                      alertHighlight ? 'ring-2 ring-amber-300/70 shadow-[0_0_25px_rgba(251,191,36,0.35)]' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">Alert interval</p>
                      <p className="text-xs text-white/60">
                        Set how often you want a “Where is your focus now?” nudge during the session.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-white shadow-inner">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                          Alert frequency
                        </label>
                        <div className="relative">
                          <select
                            className={`${selectClass} pr-10`}
                            value={stayOnTaskInterval}
                            onChange={(event) => onStayOnTaskIntervalChange(Number(event.target.value))}
                          >
                            {[5, 10, 15, 30].map((minutes) => (
                              <option key={minutes} value={minutes}>
                                {minutes} min
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                        <p className="text-xs text-white/60">Nudge: will remind you to stay focused.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-black/30 p-4">
                      <div>
                        <p className="text-sm font-semibold">Reminder style</p>
                        <p className="text-xs text-white/60">Use the toggles to decide how often nudges appear.</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex flex-1 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold">Repeat reminders</p>
                            <p className="text-[11px] text-white/60">Keep alerts firing every interval.</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={stayOnTaskModeSelected && stayOnTaskRepeat}
                            onClick={() => {
                              if (!stayOnTaskModeSelected || !stayOnTaskRepeat) {
                                onStayOnTaskModeSelected(true);
                                onStayOnTaskRepeatChange(true);
                              } else {
                                onStayOnTaskModeSelected(false);
                                onStayOnTaskRepeatChange(false);
                              }
                            }}
                            className={`relative flex h-7 w-12 items-center rounded-full border border-white/15 px-0.5 transition ${
                              stayOnTaskModeSelected && stayOnTaskRepeat
                                ? 'bg-gradient-to-r from-emerald-400/70 to-cyan-400/70 shadow-[0_8px_20px_rgba(16,185,129,0.35)]'
                                : 'bg-white/5'
                            }`}
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-800 transition-transform ${
                                stayOnTaskModeSelected && stayOnTaskRepeat ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {stayOnTaskModeSelected && stayOnTaskRepeat ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                        <div className="flex flex-1 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold">Alert once</p>
                            <p className="text-[11px] text-white/60">Send only the first reminder.</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={stayOnTaskModeSelected && !stayOnTaskRepeat}
                            onClick={() => {
                              if (!stayOnTaskModeSelected || stayOnTaskRepeat) {
                                onStayOnTaskModeSelected(true);
                                onStayOnTaskRepeatChange(false);
                              } else {
                                onStayOnTaskModeSelected(false);
                                onStayOnTaskRepeatChange(true);
                              }
                            }}
                            className={`relative flex h-7 w-12 items-center rounded-full border border-white/15 px-0.5 transition ${
                              stayOnTaskModeSelected && !stayOnTaskRepeat
                                ? 'bg-gradient-to-r from-sky-400/70 to-blue-400/70 shadow-[0_8px_20px_rgba(59,130,246,0.35)]'
                                : 'bg-white/5'
                            }`}
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-800 transition-transform ${
                                stayOnTaskModeSelected && !stayOnTaskRepeat ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {stayOnTaskModeSelected && !stayOnTaskRepeat ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className={`${stayOnTaskModeSelected ? '' : 'pointer-events-none opacity-40'}`}>
                        <p className="text-sm font-semibold">If I don’t respond</p>
                        <p className="text-xs text-white/60">
                          {stayOnTaskModeSelected
                            ? 'Choose the automatic answer recorded when you skip a check-in.'
                            : 'Select a reminder style first to enable this option.'}
                        </p>
                        <div className="mt-3 flex gap-3">
                          {(['focused', 'deviated'] as StayOnTaskFallback[]).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => onStayOnTaskFallbackChange(option)}
                              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                                stayOnTaskFallback === option
                                  ? 'border-cyan-200/70 bg-cyan-400/10 text-white shadow-[0_10px_35px_rgba(56,189,248,0.25)]'
                                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                              }`}
                            >
                              <p className="text-sm font-semibold capitalize">{option}</p>
                              <p className="text-[11px] text-white/60">
                                {option === 'focused' ? 'Mark the check-in as still on track.' : 'Log it as deviated.'}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Theme Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Color Scheme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="rounded-lg border border-white/20 bg-slate-800 p-3 text-center text-white hover:border-white/50">
                      Dark
                    </button>
                    <button className="rounded-lg border border-white/20 bg-white/5 p-3 text-center text-white hover:border-white/50">
                      Light
                    </button>
                    <button className="rounded-lg border border-blue-400 bg-blue-400/10 p-3 text-center text-blue-300">
                      Auto
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Wallpaper
                  </label>
                  <button className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-left text-white hover:border-white/50">
                    Choose from gallery
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Quote Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Quote Display
                  </label>
                  <select className={selectClass}>
                    <option value="random">Random quotes</option>
                    <option value="motivational">Motivational only</option>
                    <option value="custom">Custom quotes</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" defaultChecked />
                    <span className="text-sm text-white/80">Show quotes during breaks</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clock' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Clock Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Time Format
                  </label>
                  <div className="flex gap-3">
                    <button className="rounded-lg border border-blue-400 bg-blue-400/10 px-4 py-2 text-blue-300">
                      12h
                    </button>
                    <button className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:border-white/50">
                      24h
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Time Zone
                  </label>
                  <select className={selectClass}>
                    <option value="auto">Auto-detect</option>
                    <option value="utc">UTC</option>
                  </select>
                </div>
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
        </div>
      </div>
    </div>
  );
});
