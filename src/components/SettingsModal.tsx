import React, { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(settings.dailyGoalMinutes);
  const [pomodoroFocusMinutes, setPomodoroFocusMinutes] = useState<number>(settings.pomodoroFocusMinutes);
  const [pomodoroBreakMinutes, setPomodoroBreakMinutes] = useState<number>(settings.pomodoroBreakMinutes);
  const [pomodoroLongBreakMinutes, setPomodoroLongBreakMinutes] = useState<number>(settings.pomodoroLongBreakMinutes);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [soundVolume, setSoundVolume] = useState<number>(settings.soundVolume);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      dailyGoalMinutes,
      pomodoroFocusMinutes,
      pomodoroBreakMinutes,
      pomodoroLongBreakMinutes,
      soundEnabled,
      soundVolume,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="card p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h3 className="serif text-base font-bold text-white">Timer & Goal Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 bg-[#09090b] hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">
              Daily Target Goal (Minutes / Hours):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                max={900}
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value) || 240)}
                className="flex-1 bg-[#09090b] border border-[#27272a] text-white font-bold p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <span className="text-zinc-400 font-semibold">
                = {(dailyGoalMinutes / 60).toFixed(1)} Hours / day
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Focus (mins):</label>
              <input
                type="number"
                min={5}
                max={120}
                value={pomodoroFocusMinutes}
                onChange={(e) => setPomodoroFocusMinutes(parseInt(e.target.value) || 25)}
                className="w-full bg-[#09090b] border border-[#27272a] text-white font-bold p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Break (mins):</label>
              <input
                type="number"
                min={1}
                max={60}
                value={pomodoroBreakMinutes}
                onChange={(e) => setPomodoroBreakMinutes(parseInt(e.target.value) || 5)}
                className="w-full bg-[#09090b] border border-[#27272a] text-white font-bold p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Long Break:</label>
              <input
                type="number"
                min={5}
                max={60}
                value={pomodoroLongBreakMinutes}
                onChange={(e) => setPomodoroLongBreakMinutes(parseInt(e.target.value) || 15)}
                className="w-full bg-[#09090b] border border-[#27272a] text-white font-bold p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="border-t border-[#27272a] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300">Audio Chimes & Notifications:</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-[#27272a] bg-[#09090b] text-amber-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {soundEnabled && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Volume Level:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 bg-[#09090b] border border-[#27272a] text-zinc-300 rounded-full font-semibold hover:bg-zinc-800 text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 py-2.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
