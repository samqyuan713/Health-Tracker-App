import React, { useState } from 'react';
import { MetricLog, DailyGoals } from '../types';
import { getRelativeDateString, getStatsForDay, DEFAULT_GOALS } from '../utils';
import { getTranslation, SupportedLanguage } from '../utils/i18n';
import { Activity, Droplet, Flame, Moon, Scale, Sparkles, Trophy, Utensils } from 'lucide-react';

interface AnalyticsProps {
  logs: MetricLog[];
  goals: DailyGoals;
  currentLang?: SupportedLanguage;
}

type TabType = 'steps' | 'water' | 'calories' | 'sleep' | 'weight' | 'food';

export default function Analytics({ logs, goals, currentLang = 'en' }: AnalyticsProps) {
  const t = getTranslation(currentLang);
  const [activeTab, setActiveTab] = useState<TabType>('steps');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Generate last 7 days of dates for charting
  const last7Days = Array.from({ length: 7 }, (_, i) => getRelativeDateString(6 - i));

  // Extract stats for each day
  const chartData = last7Days.map((dateStr) => {
    const stats = getStatsForDay(logs, dateStr);
    return {
      date: dateStr,
      displayDate: new Date(dateStr + 'T00:00:00').toLocaleDateString(currentLang === 'km' ? 'km-KH' : currentLang === 'zh-CN' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'short' }),
      value: stats[activeTab] || 0
    };
  });

  const maxValue = Math.max(...chartData.map(d => d.value), 1) * 1.15; // padding for chart height
  const avgValue = Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / 7);
  const totalValue = Math.round(chartData.reduce((sum, d) => sum + d.value, 0));

  // Metric metadata designed with light color palettes
  const meta: Record<TabType, { label: string; unit: string; color: string; bg: string; target: number; desc: string; icon: any }> = {
    steps: { 
      label: t.steps || 'Steps', 
      unit: 'steps', 
      color: '#10b981', // Emerald-500
      bg: 'rgba(16, 185, 129, 0.08)',
      target: goals.steps,
      desc: t.stepsWalked || 'Steps Walked',
      icon: <Activity className="w-5 h-5 text-emerald-600" />
    },
    water: { 
      label: t.water || 'Water', 
      unit: 'ml', 
      color: '#0284c7', // Sky-600
      bg: 'rgba(2, 132, 199, 0.08)',
      target: goals.water,
      desc: t.waterIntake || 'Water Intake',
      icon: <Droplet className="w-5 h-5 text-sky-600" />
    },
    calories: { 
      label: t.calories || 'Calories', 
      unit: 'kcal', 
      color: '#e11d48', // Rose-600
      bg: 'rgba(225, 29, 72, 0.08)',
      target: goals.calories,
      desc: t.energyBurned || 'Calories burned',
      icon: <Flame className="w-5 h-5 text-rose-600" />
    },
    sleep: { 
      label: t.sleep || 'Sleep', 
      unit: 'hrs', 
      color: '#4f46e5', // Indigo-600
      bg: 'rgba(79, 70, 229, 0.08)',
      target: goals.sleep,
      desc: t.sleepQuality || 'Sleep quality',
      icon: <Moon className="w-5 h-5 text-indigo-600" />
    },
    weight: { 
      label: t.weight || 'Weight', 
      unit: 'kg', 
      color: '#6366f1', // Violet-500
      bg: 'rgba(99, 102, 241, 0.08)',
      target: 74, 
      desc: t.bodyWeight || 'Body Weight',
      icon: <Scale className="w-5 h-5 text-indigo-500" />
    },
    food: {
      label: t.food || 'Food',
      unit: 'kcal',
      color: '#d97706', // Amber-600
      bg: 'rgba(217, 119, 6, 0.08)',
      target: goals.food || 2000,
      desc: t.foodIntake || 'Food Intake',
      icon: <Utensils className="w-5 h-5 text-amber-600" />
    }
  };

  const currentMeta = meta[activeTab];

  // SVG Dimension constants
  const svgHeight = 210;
  const svgWidth = 320;
  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 15;
  const paddingBottom = 20;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Calculate coordinates for SVGs
  const barWidth = chartWidth / 7 - 6;

  // Calculate coordinates for Line path Custom weights
  const points = chartData.map((d, index) => {
    const x = paddingLeft + (chartWidth / 6) * index;
    const y = paddingTop + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Goal compliance helper
  const goalsMetCount = chartData.filter(d => {
    if (activeTab === 'weight') return true; 
    return d.value >= currentMeta.target;
  }).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-20 pt-2 select-none scrollbar-none bg-slate-50/40">
      
      {/* Title */}
      <div className="mb-3 mt-1 select-none">
        <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          Vitals Analytics
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Weekly performance & trends</p>
      </div>

      {/* Pill Selectors */}
      <div id="analytics-metric-tabs" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-3 -mx-1 px-1 shrink-0">
        {(Object.keys(meta) as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              id={`analytics-tab-${tab}`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setHoverIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                isActive 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {meta[tab].label}
            </button>
          );
        })}
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 pt-2 px-4 pb-4 sm:pt-2.5 sm:px-5 sm:pb-5 mb-4 select-none relative overflow-hidden shadow-xs">
        
        {/* Dynamic Soft Tint Light Overlay */}
        <div 
          className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[28px] opacity-25 pointer-events-none"
          style={{ backgroundColor: currentMeta.color }}
        ></div>

        {/* Elevated Header with ONLY multi-word title */}
        <div className="flex items-center justify-between mb-1 relative z-10 -mt-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-100/80 shrink-0">
              {currentMeta.icon}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-none">
              {currentMeta.desc}
            </h4>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 text-slate-600 bg-slate-50 rounded-lg border border-slate-200/70 shrink-0">
            7D Range
          </span>
        </div>

        {/* Inline SVG Chart Canvas */}
        <div className="relative h-[170px] w-full flex justify-center mt-1">
          <svg className="w-full h-full max-w-[340px]" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yVal = paddingTop + chartHeight * ratio;
              return (
                <line 
                  key={i} 
                  x1={paddingLeft} 
                  y1={yVal} 
                  x2={svgWidth - paddingRight} 
                  y2={yVal} 
                  className="stroke-slate-100" 
                  strokeWidth="1.2" 
                  strokeDasharray="4 4" 
                />
              );
            })}

            {/* Target line indicator */}
            {activeTab !== 'weight' && (
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight - (currentMeta.target / maxValue) * chartHeight}
                x2={svgWidth - paddingRight}
                y2={paddingTop + chartHeight - (currentMeta.target / maxValue) * chartHeight}
                className="stroke-amber-400/80"
                strokeWidth="1.2"
                strokeDasharray="5 2"
              />
            )}

            {/* Charts rendering logic */}
            {activeTab === 'weight' ? (
              // LINE CHART FOR WEIGHT
              <>
                <defs>
                  <linearGradient id="weight-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentMeta.color} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={currentMeta.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`}
                  fill="url(#weight-fade)"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={currentMeta.color}
                  strokeWidth="2.2"
                  className="stroke-linecap-round"
                />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === i ? '5' : '3'}
                      fill={hoverIndex === i ? '#ffffff' : currentMeta.color}
                      stroke={hoverIndex === i ? currentMeta.color : '#FFFFFF'}
                      strokeWidth="1.5"
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                    />
                  </g>
                ))}
              </>
            ) : (
              // BAR CHART FOR OTHERS
              chartData.map((d, i) => {
                const heightVal = (d.value / maxValue) * chartHeight;
                const x = paddingLeft + (chartWidth / 7) * i + 3;
                const y = paddingTop + chartHeight - heightVal;
                const isHovered = hoverIndex === i;

                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(heightVal, 3)} 
                    rx="3"
                    fill={isHovered ? '#1e293b' : currentMeta.color}
                    opacity={isHovered ? '1' : d.value >= currentMeta.target ? '0.9' : '0.4'}
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                );
              })
            )}

            {/* X-Axis labels */}
            {chartData.map((d, i) => {
              const xPos = activeTab === 'weight' 
                ? paddingLeft + (chartWidth / 6) * i 
                : paddingLeft + (chartWidth / 7) * i + 3 + barWidth / 2;
              
              return (
                <text
                  key={i}
                  x={xPos}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[8px] select-none font-bold"
                >
                  {d.displayDate}
                </text>
              );
            })}

            {/* Y Axis min/max */}
            <text x="4" y={paddingTop + 5} className="fill-slate-400 font-mono text-[8px] font-extrabold">{Math.round(maxValue)}</text>
            <text x="4" y={paddingTop + chartHeight + 1} className="fill-slate-400 font-mono text-[8px] font-extrabold">0</text>
          </svg>

          {/* Simple Tooltip on Hover */}
          {hoverIndex !== null && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white border border-slate-700/50 rounded-lg px-2 py-0.5 text-[9px] shadow-md flex items-center gap-1 leading-none">
              <span className="font-bold">
                {chartData[hoverIndex].displayDate}:
              </span>
              <span className="font-extrabold font-mono" style={{ color: '#10b981' }}>
                {chartData[hoverIndex].value.toLocaleString()} {currentMeta.unit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary insights panel */}
      <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Weekly Insights</h3>
      <div className="space-y-2.5">
        
        {/* Metric Overview totals and Averages */}
        <div className="grid grid-cols-2 gap-2.5">
          
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs select-none">
            <span className="text-xs font-medium text-slate-400 block">Weekly Average</span>
            <span className="text-lg font-black text-slate-800 block font-mono my-0.5">
              {avgValue.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{currentMeta.unit}</span>
            </span>
            <span className="text-[10px] text-slate-400">Total sum: {totalValue.toLocaleString()}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs select-none">
            <span className="text-xs font-medium text-slate-400 block">Goals Completed</span>
            <span className="text-lg font-black text-slate-800 block font-mono my-0.5">
              {activeTab === 'weight' ? '7' : `${goalsMetCount}`} <span className="text-[10px] font-normal text-slate-400">/ 7 days</span>
            </span>
            <span className="text-[10px] text-amber-600 font-bold">
              {activeTab === 'weight' ? 'Maintaining base range' : `${Math.round((goalsMetCount / 7) * 100)}% compliance`}
            </span>
          </div>

        </div>

        {/* Coach Insight Snippet box matching VitalStream look */}
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl select-none">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-emerald-800">Coach Leo's Tip</h5>
              <p className="text-xs text-emerald-950/80 mt-0.5 leading-relaxed font-medium">
                {activeTab === 'steps' && avgValue >= DEFAULT_GOALS.steps
                  ? "Outstanding aeroradial stamina building! You averaged above your 10K step goal this week. Maintain this beautiful momentum tomorrow."
                  : activeTab === 'steps'
                  ? "You are close to your step boundaries on several days. Try splitting steps into short 10-minute walks right after lunch to boost weekly stats!"
                  : activeTab === 'water' && avgValue >= DEFAULT_GOALS.water
                  ? "Fantastic hydration! Hitting your fluid goals improves energy levels significantly. Leo approves!"
                  : activeTab === 'water'
                  ? "Hydration runs slightly low. Place a clean pitcher at your desk to prompt regular sips throughout the day."
                  : activeTab === 'sleep' && avgValue >= 7
                  ? "Resting hours are solid this week. Rest is the cornerstone of biological repair. Keep bedtime routines stable!"
                  : "We averaged under 7 hours of rest. Adding even 20 minutes tonight will dramatically scale up recovery indicators."
                }
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
