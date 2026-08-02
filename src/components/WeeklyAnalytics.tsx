import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, TrendingUp, Award, Clock, Trash2, Atom, FlaskConical, Binary, Sparkles } from 'lucide-react';
import { StudySession, Task, SubjectType } from '../types';
import { SUBJECTS } from '../lib/constants';
import { formatMinutesToHours, formatDateReadable } from '../lib/utils';

interface WeeklyAnalyticsProps {
  sessions: StudySession[];
  tasks: Task[];
  onDeleteSession: (sessionId: string) => void;
  selectedSubjectFilter: SubjectType | 'all';
}

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({
  sessions,
  tasks,
  onDeleteSession,
  selectedSubjectFilter,
}) => {
  const [sessionSearch, setSessionSearch] = useState<string>('');

  const filteredSessions = sessions.filter((s) => {
    if (selectedSubjectFilter !== 'all' && s.subject !== selectedSubjectFilter) return false;
    return true;
  });

  // Calculate past 7 days analytics
  const last7DaysData = [];
  let weeklyTotalMins = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const daySessions = filteredSessions.filter((s) => s.date === dateStr);
    const dayMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    weeklyTotalMins += dayMins;

    last7DaysData.push({
      day: dayLabel,
      date: dateStr,
      Minutes: dayMins,
      Hours: parseFloat((dayMins / 60).toFixed(1)),
    });
  }

  const avgDailyMinutes = Math.round(weeklyTotalMins / 7);

  // Subject split over the week
  const phyMins = filteredSessions.filter((s) => s.subject === 'physics').reduce((acc, s) => acc + s.durationMinutes, 0);
  const chemMins = filteredSessions.filter((s) => s.subject === 'chemistry').reduce((acc, s) => acc + s.durationMinutes, 0);
  const mathMins = filteredSessions.filter((s) => s.subject === 'mathematics').reduce((acc, s) => acc + s.durationMinutes, 0);

  const subjectSplitData = [
    { name: 'Physics', value: phyMins, color: '#60a5fa' },
    { name: 'Chemistry', value: chemMins, color: '#34d399' },
    { name: 'Mathematics', value: mathMins, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  // Searchable logs table
  const searchFilteredSessions = filteredSessions.filter((s) => {
    if (!sessionSearch) return true;
    const q = sessionSearch.toLowerCase();
    return (
      s.subject.toLowerCase().includes(q) ||
      (s.linkedTaskTitle && s.linkedTaskTitle.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      s.mode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Analytics Header */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-500" />
            <h2 className="serif text-base font-bold text-white">Weekly Productivity Analytics</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Deep insights on focus hours, subject balance, and session history logs.
          </p>
        </div>

        {/* Quick Weekly Highs */}
        <div className="flex items-center gap-3">
          <div className="bg-[#09090b] px-4 py-2 rounded-xl border border-[#27272a] text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">7-Day Focus</span>
            <span className="serif text-sm font-bold text-white">{formatMinutesToHours(weeklyTotalMins)}</span>
          </div>

          <div className="bg-[#09090b] px-4 py-2 rounded-xl border border-[#27272a] text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Daily Average</span>
            <span className="serif text-sm font-bold text-amber-400">{formatMinutesToHours(avgDailyMinutes)}/day</span>
          </div>
        </div>
      </div>

      {/* Analytics Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Study Hours Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="serif text-base font-bold text-white mb-0.5">Weekly Daily Focus Hours</h3>
          <p className="text-xs text-zinc-400 mb-4">Total study hours completed per day</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#f4f4f5' }}
                  formatter={(val: any) => [`${val} Hours`, 'Focus Time']}
                />
                <Bar dataKey="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Share Donut Chart */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="serif text-base font-bold text-white">Subject Distribution</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Physics vs Chemistry vs Mathematics</p>
          </div>

          <div className="h-48 my-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectSplitData.length > 0 ? subjectSplitData : [
                    { name: 'Physics', value: 10, color: '#60a5fa' },
                    { name: 'Chemistry', value: 10, color: '#34d399' },
                    { name: 'Mathematics', value: 10, color: '#f59e0b' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121214" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#f4f4f5' }}
                  formatter={(val: any) => [`${val} mins`, 'Duration']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#27272a] text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5"><Atom className="w-3.5 h-3.5 text-blue-400" /> Physics</span>
              <span className="serif font-bold text-blue-400">{formatMinutesToHours(phyMins)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-emerald-400" /> Chemistry</span>
              <span className="serif font-bold text-emerald-400">{formatMinutesToHours(chemMins)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5"><Binary className="w-3.5 h-3.5 text-amber-400" /> Mathematics</span>
              <span className="serif font-bold text-amber-400">{formatMinutesToHours(mathMins)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Focus Session Logs History Table */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="serif text-base font-bold text-white">Focus Session History Logs</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Detailed records of all recorded study sessions</p>
          </div>

          <input
            type="text"
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            placeholder="Search sessions by task, subject, notes..."
            className="bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-amber-500"
          />
        </div>

        {searchFilteredSessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No study sessions matched your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#09090b] text-zinc-400 font-bold uppercase text-[10px] tracking-widest border-b border-[#27272a]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Linked Task / Notes</th>
                  <th className="py-3 px-4 text-center">Depth Rating</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {searchFilteredSessions.map((s) => {
                  const subj = SUBJECTS[s.subject] || SUBJECTS.physics;

                  return (
                    <tr key={s.id} className="hover:bg-[#09090b]/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-zinc-400 whitespace-nowrap">
                        {formatDateReadable(s.date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${subj.badgeBg}`}>
                          {subj.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                        {s.mode}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-zinc-100 whitespace-nowrap">
                        {s.durationMinutes} mins
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {s.linkedTaskTitle && (
                          <span className="font-semibold text-amber-400 block truncate">
                            Linked: {s.linkedTaskTitle}
                          </span>
                        )}
                        {s.notes && (
                          <span className="text-zinc-400 italic block truncate">
                            "{s.notes}"
                          </span>
                        )}
                        {!s.linkedTaskTitle && !s.notes && (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-amber-400 font-bold whitespace-nowrap">
                        {'★'.repeat(s.productivityRating)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteSession(s.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800 transition-all"
                          title="Delete Session Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
