import React from 'react';
import { Timer, LayoutDashboard, Calendar, CalendarDays, BarChart2, Cloud, Flame, Atom, FlaskConical, Binary, Settings } from 'lucide-react';
import { SubjectType } from '../types';
import { SUBJECTS } from '../lib/constants';

interface HeaderProps {
  activeTab: 'timer' | 'dashboard' | 'planner' | 'consistency' | 'analytics';
  setActiveTab: (tab: 'timer' | 'dashboard' | 'planner' | 'consistency' | 'analytics') => void;
  streakDays: number;
  openSyncModal: () => void;
  openSettingsModal: () => void;
  selectedSubjectFilter: SubjectType | 'all';
  setSelectedSubjectFilter: (subj: SubjectType | 'all') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  openSyncModal,
  openSettingsModal,
  selectedSubjectFilter,
  setSelectedSubjectFilter,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Logo & Subject Quick Filters */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-[#27272a] flex items-center justify-center text-amber-500 shadow-inner">
              <Atom className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="serif text-xl font-bold tracking-tight text-white">LUCIID</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                  Focus
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Physics • Chemistry • Math</p>
            </div>
          </div>

          {/* Subject Badges Quick Filter */}
          <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-[#27272a]">
            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                selectedSubjectFilter === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              All STEM
            </button>
            <button
              onClick={() => setSelectedSubjectFilter('physics')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1.5 transition-all ${
                selectedSubjectFilter === 'physics'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-blue-400/70 hover:text-blue-300 hover:bg-blue-950/30'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              Physics
            </button>
            <button
              onClick={() => setSelectedSubjectFilter('chemistry')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1.5 transition-all ${
                selectedSubjectFilter === 'chemistry'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Chemistry
            </button>
            <button
              onClick={() => setSelectedSubjectFilter('mathematics')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1.5 transition-all ${
                selectedSubjectFilter === 'mathematics'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-950/30'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              Mathematics
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-[#27272a] overflow-x-auto">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'timer'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'timer' ? 'bg-amber-500' : 'opacity-0'}`}></div>
            <Timer className="w-3.5 h-3.5" />
            Timer
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'dashboard' ? 'bg-amber-500' : 'opacity-0'}`}></div>
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'planner' ? 'bg-amber-500' : 'opacity-0'}`}></div>
            <Calendar className="w-3.5 h-3.5" />
            Planner
          </button>

          <button
            onClick={() => setActiveTab('consistency')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'consistency'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'consistency' ? 'bg-amber-500' : 'opacity-0'}`}></div>
            <CalendarDays className="w-3.5 h-3.5" />
            Consistency
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'analytics' ? 'bg-amber-500' : 'opacity-0'}`}></div>
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </nav>

        {/* Right Action Widgets: Streak & Sync Button */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Daily Streak Indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-[#27272a] text-amber-500 text-xs font-semibold cursor-pointer transition-all hover:border-amber-500/50"
            title="Current study streak in days"
            onClick={() => setActiveTab('consistency')}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</span>
          </div>

          {/* Cloud Sync Button */}
          <button
            onClick={openSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-[#27272a] text-zinc-300 hover:text-white text-xs font-medium transition-all"
            title="Cloud Device Synchronization Vault"
          >
            <Cloud className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">Sync</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={openSettingsModal}
            className="p-1.5 rounded-lg bg-zinc-900 border border-[#27272a] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
            title="Settings & Timer Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
