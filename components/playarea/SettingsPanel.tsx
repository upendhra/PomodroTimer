'use client';

import { useState } from 'react';
import { Bell, Palette, Quote, Watch, User, X } from 'lucide-react';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const tabs = [
  { id: 'timer', label: 'Timer & Notification', icon: Bell },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'quotes', label: 'Quotes', icon: Quote },
  { id: 'clock', label: 'Clock', icon: Watch },
  { id: 'account', label: 'Account', icon: User },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('timer');

  return (
    <div className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative ml-auto flex h-full w-full max-w-md flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl shadow-[0_25px_50px_rgba(0,0,0,0.75)] border border-white/10 transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 rounded-[16px]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-white/6 opacity-40" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/15 via-white/5 to-transparent opacity-40 blur-[30px]" />
          <div className="absolute inset-0 border border-white/5 opacity-30" />
        </div>
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/50 hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex border-b border-white/10">
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Timer Type
                  </label>
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
                    <option value="pomodoro">Pomodoro Timer</option>
                    <option value="stopwatch">Stopwatch</option>
                    <option value="stay-on-task">Stay-On-Task Timer</option>
                    <option value="countdown">Countdown Timer</option>
                    <option value="interval">Interval Timer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Focus Duration (minutes)
                  </label>
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
                    <option value="25">25 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Short Break (minutes)
                  </label>
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Long Break (minutes)
                  </label>
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span className="text-sm text-white/80">Session start notification</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span className="text-sm text-white/80">Break reminders</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span className="text-sm text-white/80">Sound effects</span>
                </label>
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
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
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
                  <select className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
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
}
