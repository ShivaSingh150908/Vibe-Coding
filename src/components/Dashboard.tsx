import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { Clock, CheckCircle2, Flame, Award, ArrowUpRight, Atom, FlaskConical, Binary, Play } from 'lucide-react';
import { StudySession, Task, UserSettings, SubjectType } from '../types';
import { SUBJECTS, DIFFICULTY_CONFIG } from '../lib/constants';
import { formatMinutesToHours, getTodayDateStr } from '../lib/utils';

interface DashboardProps {
  sessions: StudySession[];
  tasks: Task[];
  settings: UserSettings;
  streakDays: number;
  onLaunchTimerForTask: (taskId: string) => void;
  selectedSubjectFilter: SubjectType | 'all';
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  tasks,
  settings,
  streakDays,
  onLaunchTimerForTask,
  selectedSubjectFilter,
}) => {
  const todayStr = getTodayDateStr();

  // Filter sessions by subject filter if selected
  const filteredSessions = sessions.filter((s) => {
    if (selectedSubjectFilter !== 'all' && s.subject !== selectedSubjectFilter) return false;
    return true;
  });

  // Calculate Today's metrics
  const todaySessions = filteredSessions.filter((s) => s.date === todayStr);
  const todayTotalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Subject split for today / overall
  const subjectTotals: Record<string, number> = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    general: 0,
  };

  filteredSessions.forEach((s) => {
    if (subjectTotals[s.subject] !== undefined) {
      subjectTotals[s.subject] += s.durationMinutes;
    }
  });

  const subjectPieData = [
    { name: 'Physics', value: subjectTotals.physics, color: '#06b6d4', icon: Atom },
    { name: 'Chemistry', value: subjectTotals.chemistry, color: '#10b981', icon: FlaskConical },
    { name: 'Mathematics', value: subjectTotals.mathematics, color: '#8b5cf6', icon: Binary },
  ].filter((item) => item.value > 0);

  // Fallback if no sessions yet
  const displayPieData = subjectPieData.length > 0 ? subjectPieData : [
    { name: 'Physics', value: 60, color: '#60a5fa' },
    { name: 'Chemistry', value: 45, color: '#34d399' },
    { name: 'Mathematics', value: 75, color: '#f59e0b' },
  ];

  // Daily Trend Chart Data (Last 7 Days)
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const daySessions = filteredSessions.filter((s) => s.date === dateStr);
    const phyMins = daySessions.filter((s) => s.subject === 'physics').reduce((acc, s) => acc + s.durationMinutes, 0);
    const chemMins = daySessions.filter((s) => s.subject === 'chemistry').reduce((acc, s) => acc + s.durationMinutes, 0);
    const mathMins = daySessions.filter((s) => s.subject === 'mathematics').reduce((acc, s) => acc + s.durationMinutes, 0);

    last7DaysData.push({
      day: dayLabel,
      date: dateStr,
      Physics: phyMins,
      Chemistry: chemMins,
      Mathematics: mathMins,
      TotalHours: parseFloat(((phyMins + chemMins + mathMins) / 60).toFixed(1)),
    });
  }

  // Active tasks due today or in progress
  const activeTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (selectedSubjectFilter !== 'all' && t.subject !== selectedSubjectFilter) return false;
    return true;
  }).slice(0, 4);

  const completedTodayCount = tasks.filter((t) => t.completedAt === todayStr || (t.status === 'completed' && t.date === todayStr)).length;

  const goalProgressPercentage = Math.min(100, Math.round((todayTotalMinutes / settings.dailyGoalMinutes) * 100));

  return (
    <div className="space-y-6">
      
      {/* Top Key Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Study Time Metric */}
        <div className="card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Today's Focus</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="serif text-3xl font-bold text-white tracking-tight">{formatMinutesToHours(todayTotalMinutes)}</span>
            <span className="text-xs text-zinc-500">/ {formatMinutesToHours(settings.dailyGoalMinutes)} goal</span>
          </div>
          <div className="mt-3 w-full bg-[#09090b] rounded-full h-1.5 overflow-hidden border border-[#27272a]">
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${goalProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Study Streak</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500/30" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="serif text-3xl font-bold text-white tracking-tight">{streakDays}</span>
            <span className="text-xs text-zinc-500">{streakDays === 1 ? 'day' : 'days'} unbroken</span>
          </div>
          <p className="text-[11px] text-amber-400 mt-3 flex items-center gap-1 font-medium">
            🔥 Daily STEM momentum
          </p>
        </div>

        {/* Tasks Completed Today */}
        <div className="card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Tasks Completed</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="serif text-3xl font-bold text-white tracking-tight">{completedTodayCount}</span>
            <span className="text-xs text-zinc-500">tasks finished today</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-3 font-medium">
            {completedTodayCount > 0 ? '✓ High execution velocity' : 'No tasks finished yet'}
          </p>
        </div>

        {/* Average Focus Rating */}
        <div className="card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Focus Depth</span>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="serif text-3xl font-bold text-white tracking-tight">
              {(todaySessions.length > 0
                ? (todaySessions.reduce((acc, s) => acc + s.productivityRating, 0) / todaySessions.length).toFixed(1)
                : '4.8')} / 5.0
            </span>
          </div>
          <p className="text-[11px] text-purple-400 mt-3 font-medium">
            Quality rating
          </p>
        </div>

      </div>

      {/* Charts Row: Subject Distribution & 7-Day Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject Split Breakdown Donut Chart */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="serif text-base font-bold text-white flex items-center justify-between">
              <span>Subject Focus Breakdown</span>
              <span className="text-xs font-normal text-zinc-500 font-sans">Total Hours</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Time distribution across Physics, Chem & Math</p>
          </div>

          <div className="h-52 my-4 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121214" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#f4f4f5' }}
                  formatter={(val: any) => [`${val} mins (${(val / 60).toFixed(1)} hrs)`, 'Time Spent']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Custom Legend */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#27272a]">
            <div className="bg-[#09090b] p-2 rounded-lg border border-blue-500/20">
              <span className="text-[10px] font-bold text-blue-400 uppercase block">Physics</span>
              <span className="serif text-xs font-bold text-zinc-200">{formatMinutesToHours(subjectTotals.physics)}</span>
            </div>
            <div className="bg-[#09090b] p-2 rounded-lg border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Chemistry</span>
              <span className="serif text-xs font-bold text-zinc-200">{formatMinutesToHours(subjectTotals.chemistry)}</span>
            </div>
            <div className="bg-[#09090b] p-2 rounded-lg border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Math</span>
              <span className="serif text-xs font-bold text-zinc-200">{formatMinutesToHours(subjectTotals.mathematics)}</span>
            </div>
          </div>
        </div>

        {/* 7-Day Focus Trend Area Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div>
            <h3 className="serif text-base font-bold text-white flex items-center justify-between">
              <span>Weekly Focus Trend</span>
              <span className="text-xs font-medium text-zinc-500 font-sans">Daily Study Hours</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Stacked study hours over the past 7 days</p>
          </div>

          <div className="h-64 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#f4f4f5' }}
                  formatter={(value: any, name: any) => [`${value} mins`, name]}
                />
                <Bar dataKey="Physics" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Chemistry" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Mathematics" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-[#27272a]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Physics</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Chemistry</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Mathematics</span>
            </div>
            <span className="font-medium text-zinc-300">Target: 4.0h / day</span>
          </div>
        </div>

      </div>

      {/* Active Tasks Quick Launcher Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="serif text-base font-bold text-white">Next Priority Tasks</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Click "Study Now" to link task directly to timer</p>
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No active tasks found. Go to the Planner tab to add new Physics, Chemistry, or Math tasks!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTasks.map((t) => {
              const subjInfo = SUBJECTS[t.subject] || SUBJECTS.physics;
              const diffConfig = DIFFICULTY_CONFIG[t.difficulty];

              return (
                <div
                  key={t.id}
                  className="bg-[#09090b] border border-[#27272a] p-4 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-600 transition-all group"
                >
                  <div className="space-y-1.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${subjInfo.badgeBg}`}>
                        {subjInfo.shortCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffConfig.bg} ${diffConfig.color} ${diffConfig.border}`}>
                        {diffConfig.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-200 truncate group-hover:text-amber-400 transition-all">
                      {t.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{t.completedMinutes} / {t.estimatedMinutes} mins tracked</span>
                      {t.subtasks.length > 0 && (
                        <span>• {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onLaunchTimerForTask(t.id)}
                    className="shrink-0 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    Study Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
