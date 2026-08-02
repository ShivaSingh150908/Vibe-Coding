import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Maximize2, Minimize2, Volume2, VolumeX, CheckCircle, Flame, Atom, FlaskConical, Binary, Sparkles, BookOpen, Layers } from 'lucide-react';
import { TimerMode, TimerStatus, SubjectType, Task, AmbientSoundType, StudySession, UserSettings } from '../types';
import { SUBJECTS, DIFFICULTY_CONFIG } from '../lib/constants';
import { formatTime } from '../lib/utils';
import { soundEngine } from '../lib/audio';

interface TimerSectionProps {
  tasks: Task[];
  onFinishSession: (sessionData: Omit<StudySession, 'id'>, updateTaskId?: string) => void;
  settings: UserSettings;
  selectedSubjectFilter: SubjectType | 'all';
}

export const TimerSection: React.FC<TimerSectionProps> = ({
  tasks,
  onFinishSession,
  settings,
  selectedSubjectFilter,
}) => {
  // Timer settings & states
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [seconds, setSeconds] = useState<number>(settings.pomodoroFocusMinutes * 60);
  const [targetSeconds, setTargetSeconds] = useState<number>(settings.pomodoroFocusMinutes * 60);
  const [flowstateSeconds, setFlowstateSeconds] = useState<number>(0);
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(45);

  const [pomodoroCycle, setPomodoroCycle] = useState<number>(1);
  const [isBreakPhase, setIsBreakPhase] = useState<boolean>(false);

  // Subject & Task Linking
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('physics');
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');

  // Ambient Audio State
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(settings.soundVolume);

  // Fullscreen Focus Mode
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);

  // Finish Session Modal
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<string>('');

  // Filter available tasks by subject & completion status
  const availableTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (selectedSubjectFilter !== 'all' && t.subject !== selectedSubjectFilter) return false;
    if (selectedSubject !== 'general' && t.subject !== selectedSubject) return false;
    return true;
  });

  const selectedTask = tasks.find((t) => t.id === linkedTaskId);

  // When mode changes, adjust initial target seconds
  useEffect(() => {
    if (status === 'idle') {
      if (mode === 'pomodoro') {
        const initialSecs = (isBreakPhase ? settings.pomodoroBreakMinutes : settings.pomodoroFocusMinutes) * 60;
        setSeconds(initialSecs);
        setTargetSeconds(initialSecs);
      } else if (mode === 'custom') {
        const secs = customMinutesInput * 60;
        setSeconds(secs);
        setTargetSeconds(secs);
      } else if (mode === 'flowstate') {
        setFlowstateSeconds(0);
      }
    }
  }, [mode, isBreakPhase, customMinutesInput, settings]);

  // Main Timer Ticking Effect
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        if (mode === 'flowstate') {
          setFlowstateSeconds((prev) => prev + 1);
        } else {
          setSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode]);

  // Handle ambient sound playback
  useEffect(() => {
    if (status === 'running') {
      soundEngine.setAmbientSound(ambientSound, ambientVolume);
    } else {
      soundEngine.stopAmbient();
    }
  }, [ambientSound, ambientVolume, status]);

  // Handle timer reaching zero in countdown modes
  const handleTimerComplete = () => {
    setStatus('idle');
    soundEngine.stopAmbient();
    if (settings.soundEnabled) {
      soundEngine.playChime(settings.soundVolume);
    }

    if (mode === 'pomodoro') {
      if (!isBreakPhase) {
        // Focus phase completed! Show log session modal or prompt break
        setShowFinishModal(true);
        const isLongBreak = pomodoroCycle % 4 === 0;
        setIsBreakPhase(true);
        const nextBreakSecs = (isLongBreak ? settings.pomodoroLongBreakMinutes : settings.pomodoroBreakMinutes) * 60;
        setSeconds(nextBreakSecs);
        setTargetSeconds(nextBreakSecs);
      } else {
        // Break phase completed! Back to focus phase
        setIsBreakPhase(false);
        setPomodoroCycle((prev) => prev + 1);
        const focusSecs = settings.pomodoroFocusMinutes * 60;
        setSeconds(focusSecs);
        setTargetSeconds(focusSecs);
      }
    } else {
      setShowFinishModal(true);
    }
  };

  const startTimer = () => {
    if (status === 'idle') {
      startTimeRef.current = new Date().toISOString();
    }
    setStatus('running');
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resetTimer = () => {
    setStatus('idle');
    if (mode === 'flowstate') {
      setFlowstateSeconds(0);
    } else if (mode === 'pomodoro') {
      const initialSecs = (isBreakPhase ? settings.pomodoroBreakMinutes : settings.pomodoroFocusMinutes) * 60;
      setSeconds(initialSecs);
    } else if (mode === 'custom') {
      setSeconds(customMinutesInput * 60);
    }
  };

  const addFiveMinutes = () => {
    if (mode === 'flowstate') return;
    setSeconds((prev) => prev + 300);
    setTargetSeconds((prev) => prev + 300);
  };

  const handleManualFinish = () => {
    setStatus('paused');
    soundEngine.stopAmbient();
    setShowFinishModal(true);
  };

  const submitFinishedSession = () => {
    const elapsedSecs =
      mode === 'flowstate'
        ? flowstateSeconds
        : Math.max(0, targetSeconds - seconds);

    const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));

    onFinishSession(
      {
        subject: selectedTask ? selectedTask.subject : selectedSubject,
        mode,
        durationMinutes: elapsedMins,
        secondsSpent: elapsedSecs,
        startTime: startTimeRef.current || new Date(Date.now() - elapsedSecs * 1000).toISOString(),
        endTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        linkedTaskId: selectedTask ? selectedTask.id : undefined,
        linkedTaskTitle: selectedTask ? selectedTask.title : undefined,
        productivityRating: rating,
        notes: sessionNotes.trim() || undefined,
      },
      selectedTask ? selectedTask.id : undefined
    );

    setShowFinishModal(false);
    setSessionNotes('');
    resetTimer();
  };

  // Progress percentage calculation
  const getProgressPercentage = () => {
    if (mode === 'flowstate') {
      // Milestone of 60 mins
      return Math.min(100, (flowstateSeconds / 3600) * 100);
    }
    if (targetSeconds === 0) return 0;
    return Math.min(100, Math.max(0, ((targetSeconds - seconds) / targetSeconds) * 100));
  };

  const activeSubjectInfo = SUBJECTS[selectedSubject] || SUBJECTS.physics;

  return (
    <div className={`transition-all ${isFullscreenMode ? 'fixed inset-0 z-50 bg-[#09090b] p-6 flex flex-col justify-between overflow-y-auto' : 'space-y-6'}`}>
      
      {/* Top Header / Mode Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 card p-4">
        
        {/* Mode Selector Eyebrows */}
        <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded-xl border border-[#27272a] w-full md:w-auto justify-center">
          <button
            onClick={() => { setMode('pomodoro'); resetTimer(); }}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              mode === 'pomodoro'
                ? 'bg-zinc-100 text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pomodoro (25/5)
          </button>

          <button
            onClick={() => { setMode('flowstate'); resetTimer(); }}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              mode === 'flowstate'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Flowstate
          </button>

          <button
            onClick={() => { setMode('custom'); resetTimer(); }}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              mode === 'custom'
                ? 'bg-zinc-100 text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {/* Subject Selector & Fullscreen Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value as SubjectType);
                setLinkedTaskId('');
              }}
              className="bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="physics">Physics (PHY)</option>
              <option value="chemistry">Chemistry (CHEM)</option>
              <option value="mathematics">Mathematics (MATH)</option>
              <option value="general">General STEM</option>
            </select>
          </div>

          <button
            onClick={() => setIsFullscreenMode(!isFullscreenMode)}
            className="p-2 bg-[#09090b] border border-[#27272a] rounded-lg text-zinc-400 hover:text-zinc-100 transition-all"
            title={isFullscreenMode ? 'Exit Fullscreen' : 'Enter Fullscreen Focus View'}
          >
            {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Study Timer Visualizer Card */}
      <div className="relative card p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Subtle Subject Ambient Backdrop Glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none transition-all"
          style={{ backgroundColor: activeSubjectInfo.accentHex }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none transition-all"
          style={{ backgroundColor: activeSubjectInfo.accentHex }}
        />

        {/* Linked Task Bar / Subject Badge */}
        <div className="z-10 mb-6 flex flex-col items-center gap-2 w-full max-w-xl">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${activeSubjectInfo.badgeBg}`}>
              {activeSubjectInfo.name}
            </span>

            {mode === 'pomodoro' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {isBreakPhase ? '☕ Break Phase' : `🎯 Focus Cycle #${pomodoroCycle}`}
              </span>
            )}
          </div>

          {/* Task Linker Selector */}
          <div className="w-full mt-2 bg-[#09090b] border border-[#27272a] p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block">Linked Planner Task</span>
                <select
                  value={linkedTaskId}
                  onChange={(e) => setLinkedTaskId(e.target.value)}
                  className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none w-full cursor-pointer truncate"
                >
                  <option value="" className="bg-[#121214] text-zinc-400">-- None (Unlinked Study Session) --</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#121214] text-zinc-200">
                      [{t.subject.toUpperCase()}] {t.title} ({t.completedMinutes}/{t.estimatedMinutes}m)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTask && (
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${DIFFICULTY_CONFIG[selectedTask.difficulty].bg} ${DIFFICULTY_CONFIG[selectedTask.difficulty].color} ${DIFFICULTY_CONFIG[selectedTask.difficulty].border}`}>
                  {DIFFICULTY_CONFIG[selectedTask.difficulty].label}
                </span>
                <span className="text-[10px] font-medium text-zinc-400">
                  {selectedTask.completedMinutes} / {selectedTask.estimatedMinutes} mins
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Mode Input Box */}
        {mode === 'custom' && status === 'idle' && (
          <div className="z-10 mb-4 flex items-center gap-3 bg-[#09090b] border border-[#27272a] px-4 py-2 rounded-xl">
            <span className="text-xs font-medium text-zinc-400">Target Focus Duration (minutes):</span>
            <input
              type="number"
              min={1}
              max={240}
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-[#121214] border border-[#27272a] text-center text-xs font-bold text-amber-500 py-1 rounded focus:outline-none"
            />
          </div>
        )}

        {/* Circular Dial / Serif Clock Display */}
        <div className="z-10 relative my-4 flex items-center justify-center">
          
          {/* Circular SVG Progress Ring */}
          <svg className="w-72 h-72 sm:w-80 sm:h-80 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              className="stroke-zinc-800/60 fill-none"
              strokeWidth="6"
            />
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              className="fill-none transition-all duration-1000 ease-linear"
              strokeWidth="6"
              strokeDasharray={283 * 2.5}
              strokeDashoffset={(283 * 2.5) * (1 - getProgressPercentage() / 100)}
              strokeLinecap="round"
              stroke={isBreakPhase ? '#10b981' : '#f59e0b'}
            />
          </svg>

          {/* Serif Clock Text Inside Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="serif text-7xl sm:text-8xl font-normal text-white tracking-tight drop-shadow-md">
              {mode === 'flowstate' ? formatTime(flowstateSeconds) : formatTime(seconds)}
            </span>

            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mt-2">
              {mode === 'flowstate'
                ? 'Flowstate Momentum'
                : isBreakPhase
                ? 'Rest & Reset'
                : 'Focus Session'}
            </span>

            {mode === 'flowstate' && flowstateSeconds > 0 && (
              <span className="text-[11px] font-bold text-amber-500 mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {Math.floor(flowstateSeconds / 60)} Mins Passed
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="z-10 mt-6 flex items-center justify-center gap-4 flex-wrap">
          {status === 'running' ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-full font-bold text-sm shadow-md transition-all transform active:scale-95"
            >
              <Pause className="w-4 h-4 fill-black" />
              PAUSE
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-8 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full font-bold text-sm shadow-md transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              {status === 'paused' ? 'RESUME' : 'START FOCUS'}
            </button>
          )}

          {(status === 'running' || status === 'paused' || flowstateSeconds > 0 || seconds < targetSeconds) && (
            <button
              onClick={handleManualFinish}
              className="flex items-center gap-2 px-6 py-2.5 border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 rounded-full font-semibold text-xs transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              LOG SESSION
            </button>
          )}

          <button
            onClick={resetTimer}
            className="px-6 py-2.5 border border-zinc-700 hover:border-zinc-500 text-white rounded-full text-xs font-medium transition-all"
            title="Reset Timer"
          >
            RESET
          </button>

          {mode !== 'flowstate' && (
            <button
              onClick={addFiveMinutes}
              className="px-4 py-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1"
              title="Add 5 Minutes"
            >
              <Plus className="w-3.5 h-3.5" />
              5m
            </button>
          )}
        </div>

        {/* Ambient Sound Audio Synthesizer Bar */}
        <div className="z-10 mt-8 pt-6 border-t border-[#27272a] w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-400">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Focus Audio:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {[
              { id: 'none', label: 'Off' },
              { id: 'white', label: 'White' },
              { id: 'brown', label: 'Brown' },
              { id: 'rain', label: 'Rain' },
              { id: 'binaural_alpha', label: 'Alpha 10Hz' },
              { id: 'binaural_beta', label: 'Beta 18Hz' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => setAmbientSound(snd.id as AmbientSoundType)}
                className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                  ambientSound === snd.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#09090b] text-zinc-500 border border-[#27272a] hover:text-zinc-300'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {ambientSound !== 'none' && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer"
              title="Soundscape Volume"
            />
          )}
        </div>
      </div>

      {/* Session Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="serif text-xl font-bold text-white">Focus Session Complete</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Rate session depth and record key derivations or concepts mastered.
              </p>
            </div>

            {/* Productivity Rating (1 - 5 stars) */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Productivity Rating:</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                      rating >= star
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-[#09090b] text-zinc-600 border border-[#27272a]'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Session Notes:</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Solved Gauss's law problem set, derived electric field for sphere..."
                rows={3}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="w-1/2 py-2 bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold hover:bg-zinc-700 transition-all"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={submitFinishedSession}
                className="w-1/2 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-zinc-200 shadow-md transition-all"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
