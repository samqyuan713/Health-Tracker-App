import React from 'react';
import { MetricLog, DailyGoals } from '../types';
import { 
  formatDatePretty, 
  getStatsForDay, 
  MOOD_DETAILS 
} from '../utils';
import { 
  Activity, 
  Droplet, 
  Flame, 
  Moon, 
  Plus, 
  Trash2, 
  Scale,
  Utensils,
  Camera
} from 'lucide-react';

interface DashboardProps {
  logs: MetricLog[];
  goals: DailyGoals;
  selectedDate: string;
  onNavigateDate: (days: number) => void;
  onAddLog: (type: MetricLog['type'], value: number, notes?: string, photo?: string) => void;
  onDeleteLog: (id: string) => void;
  onOpenLogModal: (type: MetricLog['type']) => void;
}

export default function Dashboard({
  logs,
  goals,
  selectedDate,
  onNavigateDate,
  onAddLog,
  onDeleteLog,
  onOpenLogModal
}: DashboardProps) {

  const stats = getStatsForDay(logs, selectedDate);
  const dayLogs = logs.filter(l => l.date === selectedDate);

  // Percent calculating utilities
  const getPercent = (value: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((value / target) * 100), 100);
  };

  const stepsPct = getPercent(stats.steps, goals.steps);
  const waterPct = getPercent(stats.water, goals.water);
  const burnPct = getPercent(stats.calories, goals.calories);
  const sleepPct = getPercent(stats.sleep, goals.sleep);
  const foodPct = getPercent(stats.food, goals.food || 2000);

  const sleepLog = dayLogs.filter(l => l.type === 'sleep').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];

  // SVG Circular progress helper (designed with light themes in mind)
  const CircularProgress = ({ percent, strokeColor, size = 52, strokeWidth = 5, children }: { percent: number; strokeColor: string; size?: number; strokeWidth?: number; children?: React.ReactNode }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          {/* Track (Nice, clean light track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none stroke-linecap-round transition-all duration-500 ease-out"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  const moodInfo = stats.mood ? MOOD_DETAILS[stats.mood] : null;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-20 pt-2 select-none scrollbar-none bg-slate-50/40">
      
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200/80 mb-4 mt-1 shadow-sm">
        <button 
          id="prev-day-btn"
          onClick={() => onNavigateDate(-1)} 
          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 rounded-lg cursor-pointer"
        >
          &larr;
        </button>
        <div className="text-center">
          <h2 className="text-xs font-bold tracking-wide text-slate-800">
            {formatDatePretty(selectedDate)}
          </h2>
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-tight">{selectedDate}</span>
        </div>
        <button 
          id="next-day-btn"
          onClick={() => onNavigateDate(1)} 
          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 rounded-lg cursor-pointer"
        >
          &rarr;
        </button>
      </div>

      {/* Primary Rings grid */}
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Today's Goals</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        {/* Steps Card */}
        <div 
          id="steps-widget-card"
          onClick={() => onOpenLogModal('steps')}
          className="h-24 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-250 transition-all flex items-center justify-between cursor-pointer group hover:shadow-md"
        >
          <div className="flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Steps
            </span>
            <div>
              <div className="text-base font-black text-slate-800 tracking-tight">{stats.steps.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-slate-400">Goal: {goals.steps / 1000}k</div>
            </div>
          </div>
          <CircularProgress percent={stepsPct} strokeColor="#059669">
            <span className="text-[9px] font-extrabold font-mono text-emerald-600">{stepsPct}%</span>
          </CircularProgress>
        </div>

        {/* Water Hydration Card */}
        <div 
          id="water-widget-card"
          onClick={() => onOpenLogModal('water')}
          className="h-24 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-sky-250 transition-all flex items-center justify-between cursor-pointer group hover:shadow-md"
        >
          <div className="flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-sky-500" /> Hydration
            </span>
            <div>
              <div className="text-base font-black text-slate-800 tracking-tight">{(stats.water / 1000).toFixed(1)}L</div>
              <div className="text-[9px] font-mono text-slate-400">Goal: {(goals.water / 1000).toFixed(1)}L</div>
            </div>
          </div>
          <CircularProgress percent={waterPct} strokeColor="#0284c7">
            <span className="text-[9px] font-extrabold font-mono text-sky-600">{waterPct}%</span>
          </CircularProgress>
        </div>

        {/* Active Calories Card */}
        <div 
          id="calories-widget-card"
          onClick={() => onOpenLogModal('calories')}
          className="h-24 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-250 transition-all flex items-center justify-between cursor-pointer group hover:shadow-md"
        >
          <div className="flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" /> Burn
            </span>
            <div>
              <div className="text-base font-black text-slate-800 tracking-tight">{stats.calories} <span className="text-[10px] font-normal text-slate-500">kcal</span></div>
              <div className="text-[9px] font-mono text-slate-400">Goal: {goals.calories}</div>
            </div>
          </div>
          <CircularProgress percent={burnPct} strokeColor="#e11d48">
            <span className="text-[9px] font-extrabold font-mono text-rose-600">{burnPct}%</span>
          </CircularProgress>
        </div>

        {/* Sleep Card */}
        <div 
          id="sleep-widget-card"
          onClick={() => onOpenLogModal('sleep')}
          className="h-24 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-250 transition-all flex items-center justify-between cursor-pointer group hover:shadow-md"
        >
          <div className="flex flex-col justify-between h-full overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-500" /> Sleep Pattern
            </span>
            <div>
              <div className="text-base font-black text-slate-800 tracking-tight">{stats.sleep} <span className="text-[10px] font-normal text-slate-500">hrs</span></div>
              <div className="text-[8px] font-mono font-bold text-indigo-600 truncate max-w-[120px]" title={sleepLog?.notes || 'Tap to log sleep duration & times'}>
                {sleepLog && sleepLog.notes ? sleepLog.notes : 'Tap to log times'}
              </div>
            </div>
          </div>
          <CircularProgress percent={sleepPct} strokeColor="#4f46e5">
            <span className="text-[9px] font-extrabold font-mono text-indigo-600">{sleepPct}%</span>
          </CircularProgress>
        </div>

        {/* Food Fuel Intake Bento Card spanning full width */}
        <div 
          id="food-widget-card"
          onClick={() => onOpenLogModal('food')}
          className="col-span-2 min-h-[96px] bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-amber-350 transition-all flex items-center justify-between cursor-pointer group hover:shadow-md"
        >
          <div className="flex-1 pr-3 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" /> Food Intake
                </span>
                {/* Surface Camera Button */}
                <button
                  type="button"
                  id="surface-camera-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLogModal('food');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-[8px] uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1 transition-all shadow-sm shrink-0 cursor-pointer border border-amber-650"
                >
                  <Camera className="w-2.5 h-2.5" /> Track with Photo
                </button>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-base font-black text-slate-800 tracking-tight">{stats.food.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">kcal</span></span>
                <span className="text-[9px] font-mono text-slate-400 font-bold">Goal: {goals.food || 2000} kcal</span>
              </div>
            </div>

            {/* Render a miniature horizonal loading indicator list of lunch/dinner */}
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {dayLogs.filter(l => l.type === 'food').length === 0 ? (
                <span className="text-[8px] font-bold text-slate-400 italic">No food items recorded today</span>
              ) : (
                dayLogs.filter(l => l.type === 'food').map((meal) => {
                  const label = meal.notes?.includes(':') ? meal.notes.split(':')[1].trim() : (meal.notes || `${meal.value} kcal`);
                  return (
                    <span key={meal.id} className="text-[8px] font-extrabold bg-amber-50/50 hover:bg-amber-100/40 border border-amber-100/50 text-amber-800 px-1.5 py-0.5 rounded-lg max-w-[130px] truncate">
                      {label}
                    </span>
                  );
                })
              )}
            </div>
          </div>
          <CircularProgress percent={foodPct} strokeColor="#d97706">
            <span className="text-[9px] font-extrabold font-mono text-amber-700">{foodPct}%</span>
          </CircularProgress>
        </div>

      </div>

      {/* Weight & Mood Quick Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weight widget */}
        <div 
          id="weight-widget-card"
          onClick={() => onOpenLogModal('weight')}
          className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5 cursor-pointer hover:border-slate-350 transition-all shadow-sm"
        >
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Weight</span>
            <span className="text-xs font-black text-slate-700 font-mono">
              {stats.weight ? `${stats.weight} kg` : "Not logged"}
            </span>
          </div>
        </div>

        {/* Mood widget */}
        <div 
          id="mood-widget-card"
          onClick={() => onOpenLogModal('mood')}
          className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5 cursor-pointer hover:border-slate-350 transition-all shadow-sm"
        >
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm flex items-center justify-center">
            {moodInfo ? moodInfo.emoji : "❓"}
          </div>
          <div>
            <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Vibe</span>
            <span className="text-xs font-bold text-slate-700">
              {moodInfo ? moodInfo.label : "Tap to log"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Increment Shortcuts */}
      <h3 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">💡 Quick Logger</h3>
      <div className="flex gap-2 mb-4">
        <button 
          id="quick-add-water-250"
          onClick={() => onAddLog('water', 250, 'Quick water cup')}
          className="flex-1 py-2 px-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-sky-600 shrink-0 stroke-[3px]" /> 250ml
        </button>
        <button 
          id="quick-add-steps-1000"
          onClick={() => onAddLog('steps', 1000, 'Walk shortcut')}
          className="flex-1 py-2 px-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3px]" /> +1K Steps
        </button>
        <button 
          id="quick-add-food-400"
          onClick={() => onAddLog('food', 420, 'Snack: Almonds & Fruit')}
          className="flex-1 py-2 px-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0 stroke-[3px]" /> +420kcal
        </button>
      </div>

      {/* Historical Stream Logs */}
      <div className="flex-1 flex flex-col min-h-[160px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Activity Log</h3>
          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{dayLogs.length} logs</span>
        </div>

        {dayLogs.length === 0 ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none shadow-xs">
            <span className="text-lg mb-1">📝</span>
            <span className="text-[10px] font-bold uppercase tracking-wide">Ready to Record</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Hydration, workouts, sleep, and steps.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {dayLogs.slice().sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map((log) => {
              // Icon selector
              const iconAndColor = {
                steps: { icon: <Activity className="w-3.5 h-3.5 text-emerald-600" />, label: 'Steps', unit: 'steps', dot: 'bg-emerald-500' },
                water: { icon: <Droplet className="w-3.5 h-3.5 text-sky-600" />, label: 'Water', unit: 'ml', dot: 'bg-sky-500' },
                calories: { icon: <Flame className="w-3.5 h-3.5 text-rose-600" />, label: 'Burn', unit: 'kcal', dot: 'bg-rose-500' },
                sleep: { icon: <Moon className="w-3.5 h-3.5 text-indigo-600" />, label: 'Sleep', unit: 'hrs', dot: 'bg-indigo-500' },
                weight: { icon: <Scale className="w-3.5 h-3.5 text-indigo-650" />, label: 'Weight', unit: 'kg', dot: 'bg-indigo-400' },
                mood: { icon: <span>✨</span>, label: 'Mood Log', unit: '/ 5', dot: 'bg-emerald-500' },
                food: { icon: <Utensils className="w-3.5 h-3.5 text-amber-600" />, label: 'Food Intake', unit: 'kcal', dot: 'bg-amber-500' }
              }[log.type];

              const prettyVal = log.type === 'mood' && MOOD_DETAILS[log.value] 
                ? `${MOOD_DETAILS[log.value].emoji} ${MOOD_DETAILS[log.value].label}` 
                : `${log.value.toLocaleString()} ${iconAndColor?.unit}`;

              return (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 bg-slate-50 rounded-lg shrink-0">
                      {iconAndColor?.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {prettyVal}
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="font-mono text-slate-400 font-bold shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.notes && (
                          <>
                            <span className="text-slate-200 shrink-0">•</span>
                            <span className="truncate italic text-slate-500 font-medium">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {log.photo && (
                      <img
                        src={log.photo}
                        alt="Captured log"
                        className="w-8 h-8 rounded-lg border border-slate-100 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <button 
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 text-slate-350 hover:text-rose-500 active:scale-90 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
