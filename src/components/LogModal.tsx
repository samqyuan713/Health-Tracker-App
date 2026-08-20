import React, { useState, useEffect } from 'react';
import { MetricLog } from '../types';
import { MOOD_DETAILS, optimizeImageForUpload, getFullApiUrl } from '../utils';
import { getTranslation, SupportedLanguage } from '../utils/i18n';
import { X, Activity, Droplet, Flame, Moon, Scale, Smile, Check, Utensils, Camera, RefreshCw, Sparkles } from 'lucide-react';

interface LogModalProps {
  type: MetricLog['type'] | null;
  onClose: () => void;
  onSave: (type: MetricLog['type'], value: number, notes?: string, photo?: string) => void;
  currentLang?: SupportedLanguage;
}

export default function LogModal({ type, onClose, onSave, currentLang = 'en' }: LogModalProps) {
  const t = getTranslation(currentLang);
  const [activeType, setActiveType] = useState<MetricLog['type']>('steps');
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  // AI Vision Food Ingredients & Macros state
  const [aiIngredients, setAiIngredients] = useState<string[]>([]);
  const [aiDishName, setAiDishName] = useState<string>('');
  const [aiMacros, setAiMacros] = useState<{ protein: number; carbs: number; fat: number } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Synchronize dynamic default values depending on metric type
  useEffect(() => {
    if (!type) return;
    setActiveType(type);
  }, [type]);

  useEffect(() => {
    if (!activeType) return;
    
    // Set smart default values
    const defaults: Record<MetricLog['type'], number> = {
      steps: 5000,
      water: 500,
      calories: 300,
      sleep: 8,
      mood: 4,
      weight: 70,
      food: 500
    };
    
    setValue(defaults[activeType]);
    setNotes('');
    setPhoto(null);
    setAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisError(null);
    setAiIngredients([]);
    setAiDishName('');
    setAiMacros(null);
  }, [activeType]);

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 && activeType !== 'mood') return;
    onSave(activeType, value, notes.trim(), photo || undefined);
    onClose();
  };

  // Metric-specific metadata details
  const detailsMap: Record<MetricLog['type'], {
    title: string;
    icon: React.ReactNode;
    unit: string;
    min?: number;
    max?: number;
    step?: number;
    prompt: string;
  }> = {
    steps: {
      title: 'Log Daily Steps',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      unit: 'steps',
      min: 500,
      max: 25000,
      step: 500,
      prompt: 'How many steps did you take?'
    },
    water: {
      title: 'Log Fluids Drink',
      icon: <Droplet className="w-4 h-4 text-sky-600" />,
      unit: 'ml',
      min: 100,
      max: 2000,
      step: 50,
      prompt: 'Add water intake volume:'
    },
    calories: {
      title: 'Log Energy Burned',
      icon: <Flame className="w-4 h-4 text-rose-600" />,
      unit: 'kcal',
      min: 50,
      max: 2000,
      step: 25,
      prompt: 'Calories burned from physical activity:'
    },
    sleep: {
      title: 'Log Sleeping Rest',
      icon: <Moon className="w-4 h-4 text-indigo-600" />,
      unit: 'hours',
      min: 1,
      max: 16,
      step: 0.5,
      prompt: 'How long did you rest last night?'
    },
    weight: {
      title: 'Log Body Weight',
      icon: <Scale className="w-4 h-4 text-indigo-650" />,
      unit: 'kg',
      min: 30,
      max: 150,
      step: 0.1,
      prompt: 'Enter current weigh-in measurements:'
    },
    mood: {
      title: 'Log Mood & Vibe',
      icon: <Smile className="w-4 h-4 text-emerald-600" />,
      unit: 'vibe',
      prompt: 'How are you feeling right now?'
    },
    food: {
      title: 'Log Food Intake (Fuel)',
      icon: <Utensils className="w-4 h-4 text-amber-600" />,
      unit: 'kcal',
      min: 50,
      max: 2000,
      step: 10,
      prompt: 'Enter estimated food calories consumed:'
    }
  };

  const details = detailsMap[activeType];

  const metricTypeList: { key: MetricLog['type']; label: string; icon: string }[] = [
    { key: 'steps', label: 'Steps', icon: '👟' },
    { key: 'water', label: 'Water', icon: '💧' },
    { key: 'food', label: 'Food', icon: '🥗' },
    { key: 'sleep', label: 'Sleep', icon: '🌙' },
    { key: 'calories', label: 'Burn', icon: '🔥' },
    { key: 'weight', label: 'Weight', icon: '⚖️' },
    { key: 'mood', label: 'Mood', icon: '😊' },
  ];

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-end justify-center z-50 animate-fadeIn select-none">
      {/* Drawer layout */}
      <div className="w-full bg-white rounded-t-[28px] border-t border-slate-100 p-6 flex flex-col space-y-4 max-h-[85%] overflow-y-auto shadow-2xl animate-slideUp">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              {details.icon}
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{details.title}</h3>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-55 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200/60 bg-slate-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category switcher pills */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 border-b border-slate-100">
          {metricTypeList.map((item) => {
            const isActive = activeType === item.key;
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => setActiveType(item.key)}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 select-none">
          
          <div className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{details.prompt}</p>
            
            {/* Input values Display styling */}
            <div className="text-2xl font-black text-slate-800 font-mono tracking-tight my-1 select-all">
              {activeType === 'mood' ? (
                <div className="flex flex-col items-center gap-1 py-1">
                  <span className="text-3xl">{MOOD_DETAILS[value]?.emoji}</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{MOOD_DETAILS[value]?.label}</span>
                </div>
              ) : (
                <>
                  {value.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{details.unit}</span>
                </>
              )}
            </div>
          </div>

          {/* Slider input for standard numerical parameters */}
          {activeType !== 'mood' ? (
            <div className="space-y-1">
              <input
                id="log-slider-control"
                type="range"
                min={details.min}
                max={details.max}
                step={details.step}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-emerald-600 bg-slate-100 rounded-lg cursor-pointer h-2 outline-none border border-transparent focus:border-slate-200"
              />
              <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400">
                <span>{details.min} {details.unit}</span>
                <span>{details.max} {details.unit}</span>
              </div>
            </div>
          ) : (
            /* Mood grid buttons selector */
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((level) => {
                const info = MOOD_DETAILS[level];
                const isSelected = value === level;
                return (
                  <button
                    id={`mood-level-btn-${level}`}
                    type="button"
                    key={level}
                    onClick={() => setValue(level)}
                    className={`py-3 flex flex-col items-center gap-1 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-500 text-slate-800 ring-4 ring-emerald-500/10 shadow-sm font-semibold' 
                        : 'bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <span className="text-xl">{info.emoji}</span>
                    <span className="text-[8px] font-extrabold uppercase tracking-tight">{info.label.substring(0, 5)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom quick input shortcuts inside modal details */}
          {activeType === 'water' && (
            <div className="flex gap-1.5 justify-center py-0.5">
              {[250, 500, 750].map((vol) => (
                <button
                  type="button"
                  key={vol}
                  onClick={() => setValue(vol)}
                  className="py-1 px-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-[9px] font-extrabold text-sky-700 cursor-pointer active:scale-95 shadow-sm"
                >
                  +{vol}ml
                </button>
              ))}
            </div>
          )}
          
          {activeType === 'steps' && (
            <div className="flex gap-1.5 justify-center py-0.5">
              {[2000, 5000, 10000].map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setValue(st)}
                  className="py-1 px-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-[9px] font-extrabold text-emerald-700 cursor-pointer active:scale-95 shadow-sm"
                >
                  {st.toLocaleString()}
                </button>
              ))}
            </div>
          )}

          {activeType === 'food' && (
            <div className="space-y-3 pt-1">
              {/* Photo Display / Action Card */}
              <div className="w-full">
                {photo ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video group bg-slate-900 flex items-center justify-center">
                    <img
                      src={photo}
                      alt="Captured Meal"
                      className="w-full h-full object-cover animate-fadeIn"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-slate-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setAiIngredients([]);
                          setAiDishName('');
                          setAiMacros(null);
                          setAnalysisError(null);
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/10 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] group"
                  >
                    {analyzing ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                          AI Vision Analyzing Ingredients ({analysisProgress}%)...
                        </span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        <div className="text-center">
                          <span className="text-[10px] font-extrabold text-slate-600 block group-hover:text-amber-600 transition-colors">📷 Take / Upload Meal Photo</span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Scans meal & auto-detects ingredients with Gemini AI</span>
                        </div>
                      </>
                    )}
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAnalyzing(true);
                      setAnalysisProgress(20);
                      setAnalysisError(null);
                      
                      try {
                        // Compress/resize image on client canvas for fast, lightweight upload (~50-100KB)
                        const dataUrl = await optimizeImageForUpload(file);

                        setPhoto(dataUrl);
                        setAnalysisProgress(50);

                        // Call Gemini Vision endpoint
                        const response = await fetch(getFullApiUrl('/api/gemini/food-vision'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ imageBase64: dataUrl })
                        });
                        
                        setAnalysisProgress(85);

                        const responseText = await response.text();
                        let data: any = null;
                        try {
                          data = JSON.parse(responseText);
                        } catch {
                          if (response.status === 413) {
                            throw new Error("Image file is too large for upload. Please try a different photo.");
                          } else if (response.status === 502 || response.status === 504) {
                            throw new Error("Analysis connection timed out. Please try again.");
                          } else {
                            throw new Error(`AI Vision service temporarily unavailable (HTTP ${response.status}).`);
                          }
                        }

                        if (response.ok && data) {
                          setAnalysisProgress(100);
                          setAiDishName(data.dishName || 'Healthy Plate');
                          setAiIngredients(data.ingredients || []);
                          if (data.protein !== undefined) {
                            setAiMacros({ protein: data.protein, carbs: data.carbs, fat: data.fat });
                          }
                          if (data.calories) {
                            setValue(data.calories);
                          }
                          const ingStr = data.ingredients?.length ? `Ingredients: ${data.ingredients.join(', ')}` : '';
                          setNotes(`${data.dishName || 'Meal'} (${data.calories || 450} kcal). ${ingStr}`);
                        } else {
                          if (data?.error === 'API_KEY_MISSING') {
                            setAnalysisError('Please configure your GEMINI_API_KEY in the Settings > Secrets panel to enable AI food checking.');
                          } else {
                            setAnalysisError(data?.message || 'AI Vision analysis failed for this photo.');
                          }
                        }
                      } catch (err: any) {
                        console.error("AI Food vision error:", err);
                        const msg = err?.message || '';
                        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                          setAnalysisError('Network connection to cloud server failed. Check your internet connection or verify the Cloud URL in the Storage Settings.');
                        } else {
                          setAnalysisError(err?.message || 'Unable to analyze image. Please check your connection and try again.');
                        }
                      } finally {
                        setAnalyzing(false);
                      }
                    }
                  }}
                />
              </div>

              {/* Error Notice if Vision API encountered issue */}
              {analysisError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[9px] text-rose-700 font-medium animate-fadeIn flex items-center justify-between gap-2">
                  <span>⚠️ {analysisError}</span>
                  <button 
                    type="button" 
                    onClick={() => setAnalysisError(null)}
                    className="text-rose-500 hover:text-rose-800 font-bold uppercase text-[8px] shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* AI Identified Ingredients Badge Card */}
              {aiIngredients.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-2.5 space-y-1.5 animate-fadeIn select-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 truncate">
                        AI Identified: {aiDishName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAiIngredients([]);
                        setAiMacros(null);
                      }}
                      className="text-[8px] font-bold text-amber-700 hover:underline uppercase shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {aiIngredients.map((ing, idx) => (
                      <span 
                        key={idx} 
                        className="bg-white/90 border border-amber-300/80 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-amber-800 shadow-2xs flex items-center gap-1"
                      >
                        <span>🥗</span> {ing}
                      </span>
                    ))}
                  </div>

                  {aiMacros && (
                    <div className="flex gap-2.5 pt-1 text-[8px] font-mono font-bold text-amber-950 border-t border-amber-200/60">
                      <span>💪 {aiMacros.protein}g Protein</span>
                      <span>🍞 {aiMacros.carbs}g Carbs</span>
                      <span>🥑 {aiMacros.fat}g Fat</span>
                    </div>
                  )}
                </div>
              )}

              {/* Presets and meal category shortcuts */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block text-center">
                  Meal Category Shortcuts
                </span>
                <div className="flex gap-1.5 justify-center py-0.5 flex-wrap">
                  {[
                    { label: '🍳 Breakfast', kcal: 450, note: 'Breakfast: Eggs & Toast', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=520&auto=format&fit=crop' },
                    { label: '🥗 Lunch', kcal: 650, note: 'Lunch: Chicken Wrap', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=520&auto=format&fit=crop' },
                    { label: '🥩 Dinner', kcal: 750, note: 'Dinner: Salmon & Rice', img: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=520&auto=format&fit=crop' },
                    { label: '☕ Snack', kcal: 200, note: 'Snack: Fruit & Latte', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=520&auto=format&fit=crop' }
                  ].map((shortcut) => (
                    <button
                      type="button"
                      key={shortcut.label}
                      onClick={() => {
                        setValue(shortcut.kcal);
                        if (aiIngredients.length > 0) {
                          setNotes(`${shortcut.label.split(' ')[1]}: ${aiDishName || 'Custom Meal'} (${shortcut.kcal} kcal). Ingredients: ${aiIngredients.join(', ')}`);
                        } else {
                          setNotes(shortcut.note);
                        }
                        // Only set fallback stock photo if user has NOT captured a custom camera photo!
                        if (!photo || photo.startsWith('https://images.unsplash.com')) {
                          setPhoto(shortcut.img);
                        }
                      }}
                      className="py-1 px-2.5 bg-white hover:bg-amber-50/60 border border-amber-200/90 rounded-lg text-[9px] font-extrabold text-amber-800 cursor-pointer active:scale-95 shadow-2xs transition-all"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeType === 'sleep' && (
            <div className="flex gap-1.5 justify-center py-0.5 flex-wrap">
              {[
                { label: '🛌 11:30 PM - 7:30 AM', hrs: 8.0, note: 'Bedtime: 11:30 PM, Wake: 7:30 AM' },
                { label: '💤 11:00 PM - 7:00 AM', hrs: 8.0, note: 'Bedtime: 11:00 PM, Wake: 7:00 AM' },
                { label: '🌙 12:00 AM - 6:30 AM', hrs: 6.5, note: 'Bedtime: 12:00 AM, Wake: 6:30 AM' },
                { label: '😴 Night Rest', hrs: 7.5, note: 'Bedtime: 11:45 PM, Wake: 7:15 AM' }
              ].map((shortcut) => (
                <button
                  type="button"
                  key={shortcut.label}
                  onClick={() => {
                    setValue(shortcut.hrs);
                    setNotes(shortcut.note);
                  }}
                  className="py-1 px-2 bg-white hover:bg-slate-55 border border-indigo-150 rounded-lg text-[9px] font-extrabold text-indigo-700 cursor-pointer active:scale-95 shadow-sm"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          )}

          {/* Optional notes section */}
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Activity Notes</label>
            <input
              id="log-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. jog, yoga routine, brand of scale..."
              className="w-full h-10 bg-slate-50 border border-slate-200/80 rounded-xl px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500/80 select-text"
            />
          </div>

          {/* CTA Action button targets */}
          <div className="pt-2 flex gap-3">
            <button
              id="modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs active:scale-95 transition-all text-center cursor-pointer border border-slate-200/80"
            >
              Cancel
            </button>
            <button
              id="modal-submit-btn"
              type="submit"
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border border-emerald-600"
            >
              <Check className="w-3.5 h-3.5 stroke-[3px]" /> Record Log
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
