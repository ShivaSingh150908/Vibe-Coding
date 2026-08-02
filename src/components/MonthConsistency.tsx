import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, Clock, Award, X, Atom, FlaskConical, Binary } from 'lucide-react';
import { StudySession, Task, SubjectType } from '../types';
import { SUBJECTS } from '../lib/constants';
import { getMonthDaysMatrix, getHeatmapLevel, formatMinutesToHours, formatDateReadable } from '../lib/utils';

interface MonthConsistencyProps {
  sessions: StudySession[];
  tasks: Task[];
  selectedSubjectFilter: SubjectType | 'all';
}

export const MonthConsistency: React.FC<MonthConsistencyProps> = ({
  sessions,
  tasks,
  selectedSubjectFilter,
}) => {
  // Current view date state (year & month index 0-11)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(today.getMonth());

  // Selected Day Modal / Inspector
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Navigation handlers for prev / next month
  const prevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonthIndex, 1).toLocaleString('en-US', { month: 'long' });

  // Generate matrix
  const { days, daysInMonth } = getMonthDaysMatrix(currentYear, currentMonthIndex);

  // Map session minutes per day for current month
  const dailyMinutesMap: Record<string, { total: number; physics: number; chemistry: number; mathematics: number }> = {};

  sessions.forEach((s) => {
    if (selectedSubjectFilter !== 'all' && s.subject !== selectedSubjectFilter) return;

    if (!dailyMinutesMap[s.date]) {
      dailyMinutesMap[s.date] = { total: 0, physics: 0, chemistry: 0, mathematics: 0 };
    }
    dailyMinutesMap[s.date].total += s.durationMinutes;
    if (s.subject === 'physics') dailyMinutesMap[s.date].physics += s.durationMinutes;
    if (s.subject === 'chemistry') dailyMinutesMap[s.date].chemistry += s.durationMinutes;
    if (s.subject === 'mathematics') dailyMinutesMap[s.date].mathematics += s.durationMinutes;
  });

  // Calculate monthly aggregates
  let monthlyTotalMinutes = 0;
  let activeStudyDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = (currentMonthIndex + 1).toString().padStart(2, '0');
    const dStr = d.toString().padStart(2, '0');
    const key = `${currentYear}-${mStr}-${dStr}`;
    const dayData = dailyMinutesMap[key];
    if (dayData && dayData.total > 0) {
      monthlyTotalMinutes += dayData.total;
      activeStudyDaysCount++;
    }
  }

  const activeDaySessions = selectedDayStr
    ? sessions.filter((s) => s.date === selectedDayStr && (selectedSubjectFilter === 'all' || s.subject === selectedSubjectFilter))
    : [];

  const activeDayTasks = selectedDayStr
    ? tasks.filter((t) => t.completedAt === selectedDayStr || (t.date === selectedDayStr && t.status === 'completed'))
    : [];

  // Color classes for heatmap intensity
  const levelColorMap = [
    'bg-[#09090b] border-[#27272a] hover:border-zinc-700', // Level 0: Rest day
    'bg-amber-950/30 text-amber-300 border-amber-900/40 hover:border-amber-500/50', // Level 1: <1h
    'bg-amber-900/50 text-amber-200 border-amber-700/50 hover:border-amber-400', // Level 2: 1-2.5h
    'bg-amber-500 text-black font-bold border-amber-400 shadow-sm', // Level 3: 2.5-4h
    'bg-white text-black font-black border-white shadow-md ring-2 ring-white/30', // Level 4: 4h+
  ];

  return (
    <div className="space-y-6">
      
      {/* Month Consistency Header & Stats */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            <h2 className="serif text-base font-bold text-white">STEM Consistency Heatmap</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Month-wise view tracking your daily study discipline across Physics, Chemistry, and Mathematics.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#09090b] p-2 rounded-xl border border-[#27272a]">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-[#121214] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="serif text-xs font-bold text-zinc-100 w-32 text-center">
            {monthName} {currentYear}
          </span>

          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-[#121214] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{monthName} Total</span>
            <span className="serif text-xl font-bold text-white">{formatMinutesToHours(monthlyTotalMinutes)}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Flame className="w-5 h-5 fill-amber-500/30" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Active Days</span>
            <span className="serif text-xl font-bold text-white">{activeStudyDaysCount} / {daysInMonth} Days</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Consistency Rate</span>
            <span className="serif text-xl font-bold text-white">
              {Math.round((activeStudyDaysCount / daysInMonth) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Grid Matrix Container */}
      <div className="card p-6 space-y-4">
        
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-[#27272a]">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, idx) => {
            const dayMins = dailyMinutesMap[d.dateStr]?.total || 0;
            const level = getHeatmapLevel(dayMins);
            const isToday = d.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayStr(d.dateStr)}
                className={`min-h-[80px] sm:min-h-[96px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !d.isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
                } ${levelColorMap[level]} ${isToday ? 'ring-2 ring-amber-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${level >= 3 ? 'text-black' : 'text-zinc-300'}`}>
                    {d.dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">
                      Today
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {dayMins > 0 ? (
                    <div>
                      <span className={`text-xs font-bold block ${level >= 3 ? 'text-black' : 'text-zinc-100'}`}>
                        {formatMinutesToHours(dayMins)}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        {dailyMinutesMap[d.dateStr]?.physics > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        {dailyMinutesMap[d.dateStr]?.chemistry > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        {dailyMinutesMap[d.dateStr]?.mathematics > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-600 block">Rest</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Heatmap Legend */}
        <div className="pt-4 border-t border-[#27272a] flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2">
          <span>Click any day to inspect sessions & task log</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-[#09090b] border border-[#27272a]" title="0 hrs" />
              <span className="w-3.5 h-3.5 rounded bg-amber-950/40 border border-amber-900/40" title="<1 hr" />
              <span className="w-3.5 h-3.5 rounded bg-amber-900/50 border border-amber-700/50" title="1-2.5 hrs" />
              <span className="w-3.5 h-3.5 rounded bg-amber-500" title="2.5-4 hrs" />
              <span className="w-3.5 h-3.5 rounded bg-white" title="4+ hrs" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">More</span>
          </div>
        </div>
      </div>

      {/* Day Detail Inspector Modal */}
      {selectedDayStr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
              <div>
                <h3 className="serif text-base font-bold text-white">
                  Study Log: {formatDateReadable(selectedDayStr)}
                </h3>
                <p className="text-xs text-zinc-400">
                  Total Focus: {formatMinutesToHours(dailyMinutesMap[selectedDayStr]?.total || 0)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayStr(null)}
                className="p-1.5 bg-[#09090b] hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logged Sessions */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Study Sessions</h4>
              {activeDaySessions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No focus sessions recorded on this day.</p>
              ) : (
                activeDaySessions.map((s) => {
                  const subj = SUBJECTS[s.subject] || SUBJECTS.physics;
                  return (
                    <div key={s.id} className="bg-[#09090b] border border-[#27272a] p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${subj.badgeBg}`}>
                            {subj.shortCode}
                          </span>
                          <span className="font-bold text-zinc-200">{s.durationMinutes} Minutes</span>
                        </div>
                        {s.linkedTaskTitle && (
                          <p className="text-[11px] text-amber-400 font-medium">Linked: {s.linkedTaskTitle}</p>
                        )}
                        {s.notes && <p className="text-[11px] text-zinc-400 italic">"{s.notes}"</p>}
                      </div>
                      <span className="text-amber-400 text-xs font-bold shrink-0">{'★'.repeat(s.productivityRating)}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Completed Tasks on this day */}
            <div className="space-y-3 pt-2 border-t border-[#27272a]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Completed Tasks</h4>
              {activeDayTasks.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No tasks marked finished on this day.</p>
              ) : (
                activeDayTasks.map((t) => (
                  <div key={t.id} className="bg-[#09090b] border border-[#27272a] p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-zinc-200">✓ {t.title}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      Finished
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedDayStr(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full text-xs font-bold transition-all"
            >
              Close Day Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
