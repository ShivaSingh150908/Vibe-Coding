import React, { useState } from 'react';
import { Plus, Check, Trash2, Play, Calendar as CalendarIcon, Filter, Layers, Tag, CheckCircle2, Circle, Atom, FlaskConical, Binary, Edit3 } from 'lucide-react';
import { Task, Subtask, SubjectType, TaskDifficulty, PriorityTag, TaskStatus } from '../types';
import { SUBJECTS, DIFFICULTY_CONFIG, PRIORITY_CONFIG } from '../lib/constants';
import { formatDateReadable, getTodayDateStr } from '../lib/utils';

interface CalendarPlannerProps {
  tasks: Task[];
  onAddTask: (newTask: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onLaunchTimerForTask: (taskId: string) => void;
  selectedSubjectFilter: SubjectType | 'all';
}

export const CalendarPlanner: React.FC<CalendarPlannerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onLaunchTimerForTask,
  selectedSubjectFilter,
}) => {
  // Date Picker state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());

  // Filter States
  const [subjectFilter, setSubjectFilter] = useState<SubjectType | 'all'>(selectedSubjectFilter);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<TaskDifficulty | 'all'>('all');

  // Modal State for New Task
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subject, setSubject] = useState<SubjectType>('physics');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [priority, setPriority] = useState<PriorityTag>('medium');
  const [subtasksList, setSubtasksList] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');

  // Handle adding subtask in modal
  const handleAddSubtaskInput = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasksList([
      ...subtasksList,
      { id: `st-${Date.now()}-${Math.random()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtaskInput = (id: string) => {
    setSubtasksList(subtasksList.filter((st) => st.id !== id));
  };

  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      subject,
      date: selectedDate,
      estimatedMinutes,
      completedMinutes: 0,
      difficulty,
      priority,
      subtasks: subtasksList,
      status: 'todo',
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setSubtasksList([]);
    setShowAddModal(false);
  };

  // Toggle subtask completion on an existing task
  const handleToggleSubtaskInTask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      status: allCompleted ? 'completed' : task.completedMinutes > 0 ? 'in_progress' : task.status,
      completedAt: allCompleted ? getTodayDateStr() : undefined,
    });
  };

  // Toggle overall task status
  const handleToggleTaskStatus = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus: TaskStatus = isCompleted ? 'todo' : 'completed';

    onUpdateTask({
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? getTodayDateStr() : undefined,
    });
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (t.date !== selectedDate) return false;
    if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Date Selector Toolbar */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            <h2 className="serif text-base font-bold text-white">STEM Task Planner</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Organize study tasks by subject, subtasks, difficulty rating, and priority levels.
          </p>
        </div>

        {/* Date Selector & Add Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#09090b] p-2 rounded-xl border border-[#27272a]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 pl-1">Target Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#121214] border border-[#27272a] text-zinc-100 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-full flex items-center gap-1.5 shadow-md transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#121214] border border-[#27272a] p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Filters:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as SubjectType | 'all')}
            className="bg-[#09090b] border border-[#27272a] text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Subjects</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="mathematics">Mathematics</option>
            <option value="general">General STEM</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="bg-[#09090b] border border-[#27272a] text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as TaskDifficulty | 'all')}
            className="bg-[#09090b] border border-[#27272a] text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="olympiad">JEE / Olympiad</option>
          </select>
        </div>
      </div>

      {/* Tasks List Grid */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="card p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="serif text-base font-bold text-zinc-300">No tasks scheduled for {formatDateReadable(selectedDate)}</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Click "Add Task" above to schedule Physics, Chemistry, or Mathematics problem sets and derivations.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Task for Today
            </button>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const subjInfo = SUBJECTS[t.subject] || SUBJECTS.physics;
            const diffConfig = DIFFICULTY_CONFIG[t.difficulty];
            const priorityConfig = PRIORITY_CONFIG[t.priority];
            const isDone = t.status === 'completed';

            return (
              <div
                key={t.id}
                className={`card p-5 transition-all space-y-4 ${
                  isDone ? 'opacity-65' : 'hover:border-zinc-600'
                }`}
              >
                {/* Top Row: Checkbox, Title & Badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTaskStatus(t)}
                      className="mt-0.5 text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${subjInfo.badgeBg}`}>
                          {subjInfo.name}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffConfig.bg} ${diffConfig.color} ${diffConfig.border}`}>
                          {diffConfig.label}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
                          {priorityConfig.label} Priority
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                        {t.title}
                      </h3>

                      {t.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">{t.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Launch Timer & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isDone && (
                      <button
                        onClick={() => onLaunchTimerForTask(t.id)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-amber-300" />
                        Study Task
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1.5 bg-[#09090b] hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 border border-[#27272a] rounded-lg transition-all"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Progress Checklist */}
                {t.subtasks && t.subtasks.length > 0 && (
                  <div className="bg-[#09090b] border border-[#27272a] p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Subtasks Progress</span>
                      <span>
                        {t.subtasks.filter((st) => st.completed).length} / {t.subtasks.length} Completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {t.subtasks.map((st) => (
                        <label
                          key={st.id}
                          className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer bg-[#121214] hover:bg-zinc-800/50 p-2 rounded-lg border border-[#27272a] transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtaskInTask(t, st.id)}
                            className="rounded border-[#27272a] bg-[#09090b] text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={st.completed ? 'line-through text-zinc-500' : ''}>
                            {st.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Stats */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-[#27272a]">
                  <span>Tracked Time: <strong className="text-zinc-300">{t.completedMinutes}m</strong> / {t.estimatedMinutes}m estimated</span>
                  <span>Created: {formatDateReadable(t.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewTask}
            className="card p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="serif text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                Add New STEM Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Title & Subject */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Task Title:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Derive Maxwell Wave Equations / Solve Organic Mechanism Problems"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Subject:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectType)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="physics">Physics (PHY)</option>
                    <option value="chemistry">Chemistry (CHEM)</option>
                    <option value="mathematics">Mathematics (MATH)</option>
                    <option value="general">General STEM</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Est. Minutes:</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Difficulty & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Difficulty Level:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="olympiad">JEE / Olympiad</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Priority Tag:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityTag)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Description / Notes:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Problem numbers, reference textbook chapters, or formula list..."
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Subtasks Creator */}
              <div className="space-y-2 border-t border-[#27272a] pt-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Subtasks Checklist:</label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask step (e.g. Derive formula)"
                    className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskInput}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all"
                  >
                    Add
                  </button>
                </div>

                {subtasksList.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {subtasksList.map((st) => (
                      <div key={st.id} className="flex items-center justify-between bg-[#09090b] p-2 rounded-lg border border-[#27272a] text-xs text-zinc-300">
                        <span>• {st.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskInput(st.id)}
                          className="text-rose-400 text-xs font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-1/2 py-2 bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-zinc-200 shadow-md transition-all"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
