import React, { useState, useEffect } from 'react';
import MobileFrame from './components/MobileFrame';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AICoach from './components/AICoach';
import LogModal from './components/LogModal';
import SensorHub from './components/SensorHub';
import Soundscapes from './components/Soundscapes';
import AuthModal from './components/AuthModal';
import StorageHousekeepingModal from './components/StorageHousekeepingModal';
import ProUpgradeModal from './components/ProUpgradeModal';

import { MetricLog, DailyGoals, ChatMessage, UserProfile } from './types';
import { SEED_LOGS, DEFAULT_GOALS, getRelativeDateString, getStatsForDay } from './utils';
import { TRANSLATIONS, SupportedLanguage } from './utils/i18n';

import { 
  Heart, 
  TrendingUp, 
  Sparkles, 
  Plus,
  Camera,
  Music,
  UserCheck,
  HardDrive,
  Crown,
  Zap,
  Globe
} from 'lucide-react';

const DEFAULT_USER: UserProfile = {
  id: 'google_qyuan_sam',
  name: 'Sam Yuan',
  email: 'qyuan.sam@gmail.com',
  authProvider: 'google',
  signedInAt: new Date().toISOString()
};

export default function App() {
  // Current user account profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('vitalstream_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHousekeepingOpen, setIsHousekeepingOpen] = useState<boolean>(false);
  
  // Monetization & Subscription state
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'payg'>(() => {
    return (localStorage.getItem('vitalstream_user_tier') as 'free' | 'pro' | 'payg') || 'pro';
  });
  const [paygCredits, setPaygCredits] = useState<number>(() => {
    const saved = localStorage.getItem('vitalstream_payg_credits');
    return saved ? parseInt(saved, 10) : 30;
  });
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

  // i18n Language State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('vitalstream_language') as SupportedLanguage) || 'en';
  });

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    localStorage.setItem('vitalstream_language', lang);
  };

  const t = TRANSLATIONS[currentLang];

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'coach-leo' | 'sensors' | 'soundscapes'>('dashboard');
  
  // Date tracking (relative offset from today)
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Core app tracking states
  const [logs, setLogs] = useState<MetricLog[]>([]);
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active modal log type
  const [modalLogType, setModalLogType] = useState<MetricLog['type'] | null>(null);

  // Sync date when day offset changes
  useEffect(() => {
    setSelectedDate(getRelativeDateString(dayOffset));
  }, [dayOffset]);

  // Load state whenever user ID or profile changes
  useEffect(() => {
    const userKeyLogs = `health_tracker_logs_${currentUser.id}`;
    const userKeyGoals = `health_tracker_goals_${currentUser.id}`;
    const userKeyChat = `health_tracker_chat_${currentUser.id}`;

    const savedLogs = localStorage.getItem(userKeyLogs);
    const savedGoals = localStorage.getItem(userKeyGoals);
    const savedChat = localStorage.getItem(userKeyChat);

    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLogs(SEED_LOGS);
      }
    } else {
      setLogs(SEED_LOGS);
    }

    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        setGoals(DEFAULT_GOALS);
      }
    } else {
      setGoals(DEFAULT_GOALS);
    }

    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch (e) {
        setChatHistory([]);
      }
    } else {
      setChatHistory([]);
    }
  }, [currentUser.id]);

  // Save changes to localStorage per active user
  const saveLogsToStorage = (newLogs: MetricLog[]) => {
    localStorage.setItem(`health_tracker_logs_${currentUser.id}`, JSON.stringify(newLogs));
  };

  const saveChatToStorage = (newChat: ChatMessage[]) => {
    localStorage.setItem(`health_tracker_chat_${currentUser.id}`, JSON.stringify(newChat));
  };

  const handleSwitchUser = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    localStorage.setItem('vitalstream_active_user', JSON.stringify(newUser));
  };

  const handleNavigateDate = (offsetIncrement: number) => {
    const newOffset = dayOffset - offsetIncrement;
    if (newOffset < 0) return; 
    setDayOffset(newOffset);
  };

  const handleAddLog = (type: MetricLog['type'], value: number, notes?: string, photo?: string) => {
    const newLogItem: MetricLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      date: selectedDate, 
      type,
      value,
      notes,
      photo
    };

    const updatedLogs = [...logs, newLogItem];
    setLogs(updatedLogs);
    saveLogsToStorage(updatedLogs);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    saveLogsToStorage(updated);
  };

  // Chat message sender calling Express proxy server
  const handleSendCoachMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedCol = [...chatHistory, userMsg];
    setChatHistory(updatedCol);
    saveChatToStorage(updatedCol);
    setIsGenerating(true);

    const currentStats = getStatsForDay(logs, selectedDate);
    const sleepLog = logs.filter(l => l.date === selectedDate && l.type === 'sleep').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
    const foodLogs = logs.filter(l => l.date === selectedDate && l.type === 'food');
    const foodListStr = foodLogs.map(f => `${f.notes || 'Meal'}: ${f.value} kcal`).join(', ') || 'No food logged yet';
    
    const summaryText = `The user's stats for date ${selectedDate} are: ${currentStats.steps} steps (Target ${goals.steps}), ${currentStats.water} ml of water (Target ${goals.water}), ${currentStats.calories} kcal burned (Target ${goals.calories}), sleep hours: ${currentStats.sleep} hrs (Target ${goals.sleep}, Pattern Details: "${sleepLog?.notes || 'none'}"). Food Intake: ${currentStats.food} kcal (Target ${goals.food || 2000} kcal, Food logged: [ ${foodListStr} ]). Current Mood/wellbeing: ${currentStats.mood || "unlogged"}/5. Weight recorded: ${currentStats.weight || "unlogged"}kg.`;

    try {
      const response = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: updatedCol,
          userSummary: summaryText
        }),
      });

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.text || "Sorry, I am facing trouble responding right now. Let's try again in a bit!",
        timestamp: new Date().toISOString()
      };

      const finalHistory = [...updatedCol, assistantMsg];
      setChatHistory(finalHistory);
      saveChatToStorage(finalHistory);

    } catch (error) {
      console.error('Failed to query coach endpoint:', error);
      const errMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: "Oops! I encountered an error connecting to my server. Please double-check your workspace internet connection and verify that you have provided the GEMINI_API_KEY inside your AI Studio panel secrets!",
        timestamp: new Date().toISOString()
      };
      const finalHistory = [...updatedCol, errMessage];
      setChatHistory(finalHistory);
      saveChatToStorage(finalHistory);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Reset chat history with Coach Leo?")) {
      setChatHistory([]);
      localStorage.removeItem('health_tracker_chat_v1');
    }
  };

  // Dynamically calculate averages for Left Sidebar Weekly Performance over last 7 days
  const getWeeklyComplianceLevels = () => {
    let totalsStepsPct = 0;
    let totalsSleepPct = 0;
    
    for (let i = 0; i < 7; i++) {
      const dt = getRelativeDateString(i);
      const st = getStatsForDay(logs, dt);
      
      const stPct = st.steps >= goals.steps ? 100 : Math.round((st.steps / goals.steps) * 100);
      const slPct = st.sleep >= goals.sleep ? 100 : Math.round((st.sleep / goals.sleep) * 100);
      
      totalsStepsPct += stPct;
      totalsSleepPct += slPct;
    }

    return {
      stepsAvg: Math.round(totalsStepsPct / 7),
      sleepAvg: Math.round(totalsSleepPct / 7)
    };
  };

  const weeklyStats = getWeeklyComplianceLevels();

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden select-none">
      
      {/* Top Professional Navigation Bar (Desktop sizes, hides on narrow frames) */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm">V</div>
          <span className="font-extrabold text-lg tracking-tight text-slate-800">
            VitalStream <span className="text-emerald-600 font-black">Pro</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Watch Sync Active
          </div>
          {/* Language / Asian Languages Selector Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 px-2 rounded-2xl border border-slate-200/80 text-[10px] font-bold">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent font-extrabold text-slate-800 text-[10px] focus:outline-none cursor-pointer py-1"
              title={t.selectLanguage}
            >
              <option value="en">English (US)</option>
              <option value="zh-CN">简体中文 (CN)</option>
              <option value="zh-TW">繁體中文 (TW)</option>
              <option value="ja">日本語 (JP)</option>
              <option value="ko">한국어 (KR)</option>
              <option value="km">ភាសាខ្មែរ (KH)</option>
            </select>
          </div>

          <button
            onClick={() => setIsHousekeepingOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 px-3 rounded-2xl text-[10px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Inspect & Clean Local Phone Storage"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Storage Clean</span>
          </button>

          {/* Monetization / Pro Subscription & Pay-As-You-Go Button */}
          <button
            onClick={() => setIsProModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white p-2 px-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95 cursor-pointer shadow-sm"
            title="View Monetization Plans, Pro Subscription & Credits"
          >
            {userTier === 'pro' && <Crown className="w-3.5 h-3.5 fill-white" />}
            {userTier === 'payg' && <Zap className="w-3.5 h-3.5 fill-white" />}
            {userTier === 'free' && <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {userTier === 'pro' ? 'Pro Unlimited' : userTier === 'payg' ? `Credits: ${paygCredits}` : 'Upgrade Pro'}
            </span>
          </button>
          
          <div className="hidden md:block h-6 w-[1px] bg-slate-200"></div>
          
          {/* Interactive Google Sign-In & User Account Profile Trigger */}
          <div 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-all bg-slate-50 hover:bg-slate-100 p-1.5 px-3 rounded-2xl border border-slate-200/90 shadow-2xs group"
            title="Click to switch or sign in with Google ID"
          >
            <div className="text-right">
              <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Google ID Connected
              </p>
              <p className="text-xs font-black text-slate-800 font-sans tracking-tight group-hover:text-emerald-700 transition-colors">
                {currentUser.name}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-200 shadow-sm flex items-center justify-center text-white font-black text-xs select-none">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame structure */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Performance Compliance Widgets */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 p-6 flex-col justify-between shrink-0 select-none">
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Weekly Performance</h3>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Index</span>
                    <span className="text-xs font-black text-emerald-600">{weeklyStats.stepsAvg}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${weeklyStats.stepsAvg}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sleep Quality</span>
                    <span className="text-xs font-black text-indigo-600">{weeklyStats.sleepAvg}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${weeklyStats.sleepAvg}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Compliance Guideline</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Aim to maintain your indicators above 80% to ensure sustainable health progress. Keep logging daily stats!
              </p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('coach-leo')}
            className="bg-emerald-600 rounded-2xl p-4 text-white hover:bg-emerald-550 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <p className="text-[9px] font-extrabold tracking-widest uppercase opacity-85 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white animate-pulse" /> AI Health Partner
            </p>
            <p className="text-[11px] font-semibold leading-snug">
              "Great work loading steps today! Want a customized meal advisory block? Tap here to ask."
            </p>
          </div>
        </aside>

        {/* Center content containing our customized phone application preview */}
        <main className="flex-1 flex items-center justify-center bg-slate-100/50 p-2 md:p-4 overflow-hidden relative">
          
          <MobileFrame>
            
            {/* Mobile Top User Account Header Bar */}
            <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-[10px] shrink-0 border-b border-slate-800 shadow-xs select-none">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                <span className="font-extrabold tracking-tight truncate text-slate-100">{currentUser.name}</span>
                <span className="text-slate-400 truncate text-[9px] hidden sm:inline">({currentUser.email})</span>
              </div>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[8px] uppercase tracking-wider rounded-md cursor-pointer transition-all shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <UserCheck className="w-2.5 h-2.5" /> Google ID
              </button>
            </div>

            {/* Dynamic Tab View routing inside the shell phone frame */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  logs={logs}
                  goals={goals}
                  selectedDate={selectedDate}
                  onNavigateDate={handleNavigateDate}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  onOpenLogModal={(type) => setModalLogType(type)}
                />
              )}

              {activeTab === 'analytics' && (
                <Analytics 
                  logs={logs}
                  goals={goals}
                />
              )}

              {activeTab === 'coach-leo' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <AICoach 
                    chatHistory={chatHistory}
                    onSendMessage={handleSendCoachMessage}
                    logs={logs}
                    selectedDate={selectedDate}
                    isGenerating={isGenerating}
                  />
                  {/* Quick Reset Chat Option */}
                  {chatHistory.length > 0 && (
                    <button 
                      id="reset-chat-btn"
                      onClick={handleClearHistory}
                      className="absolute top-14 right-4 py-1 px-2.5 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-[8px] font-bold text-white uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all z-20 cursor-pointer"
                    >
                      Reset chat
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'sensors' && (
                <SensorHub 
                  onAddLog={handleAddLog}
                  selectedDate={selectedDate}
                />
              )}

              {activeTab === 'soundscapes' && (
                <Soundscapes 
                  onAddLog={handleAddLog}
                  selectedDate={selectedDate}
                />
              )}
            </div>

            {/* Quick entry Floating Add logger button - only shown on Journal / Dashboard view */}
            {activeTab === 'dashboard' && (
              <div className="absolute bottom-20 right-4 z-40">
                <button 
                  id="quick-floating-log-btn"
                  onClick={() => setModalLogType('steps')}
                  className="w-11 h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all hover:scale-105 border border-emerald-500"
                  title="Quick entry health logging"
                >
                  <Plus className="w-5 h-5 stroke-[3px]" />
                </button>
              </div>
            )}

             {/* Premium, polished bottom Navigation Bar inside the simulated phone viewport */}
            <nav id="bottom-tabs-rail" className="w-full h-16 bg-white border-t border-slate-200/80 flex items-center justify-around px-2 relative z-30 select-none shrink-0">
              
              {/* Dashboard Tab */}
              <button
                id="dashboard-tab-btn"
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'dashboard' ? 'text-emerald-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${activeTab === 'dashboard' ? 'fill-emerald-600/10 stroke-[2.5px]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">Journal</span>
              </button>

              {/* Analytics Tab */}
              <button
                id="analytics-tab-btn"
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'analytics' ? 'text-emerald-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp className={`w-4.5 h-4.5 ${activeTab === 'analytics' ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">Analytics</span>
              </button>

              {/* Sensors & Camera Tab */}
              <button
                id="sensors-tab-btn"
                onClick={() => setActiveTab('sensors')}
                className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'sensors' ? 'text-emerald-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Camera className={`w-4.5 h-4.5 ${activeTab === 'sensors' ? 'fill-emerald-600/10 stroke-[2.5px]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">Sensors</span>
              </button>

              {/* AI Soundscape / Music Tab */}
              <button
                id="soundscapes-tab-btn"
                onClick={() => setActiveTab('soundscapes')}
                className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'soundscapes' ? 'text-emerald-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Music className={`w-4.5 h-4.5 ${activeTab === 'soundscapes' ? 'fill-emerald-600/10 stroke-[2.5px]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">AI Music</span>
              </button>

              {/* Coach Leo Chat Tab */}
              <button
                id="coach-leo-tab-btn"
                onClick={() => setActiveTab('coach-leo')}
                className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'coach-leo' ? 'text-emerald-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles className={`w-4.5 h-4.5 ${activeTab === 'coach-leo' ? 'fill-emerald-600/10 stroke-[2.5px]' : 'animate-pulse'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">Coach AI</span>
              </button>

            </nav>

            {/* Log popup drawer selection overlay inside the phone scope view */}
            <LogModal 
              type={modalLogType}
              onClose={() => setModalLogType(null)}
              onSave={handleAddLog}
            />

          </MobileFrame>

        </main>

        {/* Right Sidebar: Vitals & Watch Diagnostics */}
        <aside className="hidden xl:flex w-72 bg-white border-l border-slate-200 p-6 flex-col justify-between shrink-0 select-none">
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Vitals Monitoring</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Blood Oxygen</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-tight">Normal Range</p>
                  </div>
                  <p className="text-lg font-black text-slate-800 font-mono">98%</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">HRV Readiness</p>
                    <p className="text-[10px] text-indigo-650 font-semibold uppercase tracking-tight">High Readiness</p>
                  </div>
                  <p className="text-lg font-black text-slate-800 font-mono">64ms</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Body Temperature</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Stable baseline</p>
                  </div>
                  <p className="text-lg font-black text-slate-800 font-mono">98.4°F</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Device Connection</h4>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Watch Ultra Connected</p>
              </div>
              <button 
                onClick={() => setActiveTab('sensors')}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-wider hover:bg-indigo-500 hover:text-white shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Open Sensors Lab
              </button>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
            VitalStream Health Suite
          </div>
        </aside>

      </div>

      {/* Footer HIPAA Status Bar */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 md:px-8 flex items-center justify-between shrink-0 select-none z-50">
        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Session Status: Active</span>
          <span className="hidden sm:inline">Cloud Sync: Secured</span>
          <span className="hidden md:inline">Compliance: HIPAA Client SSL-256</span>
        </div>
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          HIPAA Encryption Active
        </div>
      </footer>

      {/* Google Authentication & Account Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* Storage & Housekeeping Manager Modal */}
      <StorageHousekeepingModal 
        isOpen={isHousekeepingOpen}
        onClose={() => setIsHousekeepingOpen(false)}
        userId={currentUser.id}
        logs={logs}
        chatHistory={chatHistory}
        onUpdateLogs={(newLogs) => {
          setLogs(newLogs);
          saveLogsToStorage(newLogs);
        }}
        onUpdateChat={(newChat) => {
          setChatHistory(newChat);
          saveChatToStorage(newChat);
        }}
      />

      {/* Monetization & Pro Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        currentTier={userTier}
        credits={paygCredits}
        onSelectTier={(newTier, newCredits) => {
          setUserTier(newTier);
          localStorage.setItem('vitalstream_user_tier', newTier);
          if (newCredits !== undefined) {
            setPaygCredits(newCredits);
            localStorage.setItem('vitalstream_payg_credits', newCredits.toString());
          }
        }}
      />

    </div>
  );
}
