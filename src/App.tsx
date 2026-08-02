import React, { useState, useEffect } from 'react';
import { AppStateData, StudySession, Task, UserSettings, SubjectType } from './types';
import { loadAppState, saveAppState } from './lib/storage';
import { calculateStudyStreak } from './lib/utils';
import { Header } from './components/Header';
import { TimerSection } from './components/TimerSection';
import { Dashboard } from './components/Dashboard';
import { CalendarPlanner } from './components/CalendarPlanner';
import { MonthConsistency } from './components/MonthConsistency';
import { WeeklyAnalytics } from './components/WeeklyAnalytics';
import { CloudSyncModal } from './components/CloudSyncModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<'timer' | 'dashboard' | 'planner' | 'consistency' | 'analytics'>('timer');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectType | 'all'>('all');

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Auto-save state changes to LocalStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Listen for BroadcastChannel updates from other open browser tabs
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('stem_tracker_sync');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATED') {
          setAppState(loadAppState());
        }
      };
      return () => channel.close();
    } catch (e) {}
  }, []);

  const streakDays = calculateStudyStreak(appState.sessions);

  // Add Study Session Handler
  const handleFinishSession = (sessionData: Omit<StudySession, 'id'>, updateTaskId?: string) => {
    const newSession: StudySession = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    let updatedTasks = [...appState.tasks];

    // If session was linked to a task, update task's completedMinutes
    if (updateTaskId) {
      updatedTasks = updatedTasks.map((t) => {
        if (t.id === updateTaskId) {
          const newCompletedMins = t.completedMinutes + sessionData.durationMinutes;
          const isFinished = newCompletedMins >= t.estimatedMinutes;
          return {
            ...t,
            completedMinutes: newCompletedMins,
            status: isFinished ? 'completed' : 'in_progress',
            completedAt: isFinished ? new Date().toISOString().split('T')[0] : t.completedAt,
          };
        }
        return t;
      });
    }

    setAppState((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      tasks: updatedTasks,
    }));
  };

  // Task CRUD Handlers
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAppState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setAppState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setAppState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleLaunchTimerForTask = (_taskId: string) => {
    setActiveTab('timer');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          streakDays={streakDays}
          openSyncModal={() => setIsSyncModalOpen(true)}
          openSettingsModal={() => setIsSettingsModalOpen(true)}
          selectedSubjectFilter={selectedSubjectFilter}
          setSelectedSubjectFilter={setSelectedSubjectFilter}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          {activeTab === 'timer' && (
            <TimerSection
              tasks={appState.tasks}
              onFinishSession={handleFinishSession}
              settings={appState.settings}
              selectedSubjectFilter={selectedSubjectFilter}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              sessions={appState.sessions}
              tasks={appState.tasks}
              settings={appState.settings}
              streakDays={streakDays}
              onLaunchTimerForTask={handleLaunchTimerForTask}
              selectedSubjectFilter={selectedSubjectFilter}
            />
          )}

          {activeTab === 'planner' && (
            <CalendarPlanner
              tasks={appState.tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onLaunchTimerForTask={handleLaunchTimerForTask}
              selectedSubjectFilter={selectedSubjectFilter}
            />
          )}

          {activeTab === 'consistency' && (
            <MonthConsistency
              sessions={appState.sessions}
              tasks={appState.tasks}
              selectedSubjectFilter={selectedSubjectFilter}
            />
          )}

          {activeTab === 'analytics' && (
            <WeeklyAnalytics
              sessions={appState.sessions}
              tasks={appState.tasks}
              onDeleteSession={handleDeleteSession}
              selectedSubjectFilter={selectedSubjectFilter}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#121214] py-4 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>STEM Study Focus Engine • Physics • Chemistry • Mathematics</span>
          <span className="font-mono text-[11px] text-zinc-400">Vault Key: {appState.settings.syncVaultKey}</span>
        </div>
      </footer>

      {/* Cloud Sync Vault Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        appState={appState}
        onStateSynced={(newState) => setAppState(newState)}
      />

      {/* Timer & App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appState.settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
