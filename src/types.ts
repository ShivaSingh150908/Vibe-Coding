export type SubjectType = 'physics' | 'chemistry' | 'mathematics' | 'general';

export type TimerMode = 'flowstate' | 'pomodoro' | 'custom';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'break';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'olympiad';

export type PriorityTag = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subject: SubjectType;
  date: string; // YYYY-MM-DD
  estimatedMinutes: number;
  completedMinutes: number;
  difficulty: TaskDifficulty;
  priority: PriorityTag;
  subtasks: Subtask[];
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface StudySession {
  id: string;
  subject: SubjectType;
  mode: TimerMode;
  durationMinutes: number; // calculated minutes spent
  secondsSpent: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  date: string; // YYYY-MM-DD
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  productivityRating: number; // 1 to 5 stars
  notes?: string;
}

export type AmbientSoundType = 'none' | 'white' | 'brown' | 'rain' | 'binaural_alpha' | 'binaural_beta';

export interface UserSettings {
  dailyGoalMinutes: number; // e.g. 240 = 4 hours
  pomodoroFocusMinutes: number; // e.g. 25
  pomodoroBreakMinutes: number; // e.g. 5
  pomodoroLongBreakMinutes: number; // e.g. 15
  autoStartNextCycle: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  syncVaultKey: string;
  autoCloudSync: boolean;
  lastSyncedAt?: string;
}

export interface AppStateData {
  tasks: Task[];
  sessions: StudySession[];
  settings: UserSettings;
  version: number;
}

export interface SubjectInfo {
  id: SubjectType;
  name: string;
  shortCode: string;
  color: string; // tailwind text color
  bgColor: string; // tailwind bg color
  borderColor: string; // tailwind border
  badgeBg: string;
  accentHex: string;
  description: string;
  topicsSample: string[];
}
