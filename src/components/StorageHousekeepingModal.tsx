import React, { useState, useEffect, useRef } from 'react';
import { HardDrive, Trash2, Image, MessageSquare, Database, RefreshCw, Check, AlertTriangle, ShieldCheck, X, Download, Upload, FileJson, Globe, Wifi, Server, Copy, Languages } from 'lucide-react';
import { MetricLog, ChatMessage, DailyGoals } from '../types';
import { exportHealthBackupJSON, DEFAULT_GOALS, DEFAULT_HOSTED_BACKEND_URL, getApiBaseUrl, getFullApiUrl } from '../utils';
import { SupportedLanguage, TRANSLATIONS, getTranslation } from '../utils/i18n';

interface StorageHousekeepingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  logs: MetricLog[];
  goals?: DailyGoals;
  chatHistory: ChatMessage[];
  onUpdateLogs: (logs: MetricLog[]) => void;
  onUpdateGoals?: (goals: DailyGoals) => void;
  onUpdateChat: (chat: ChatMessage[]) => void;
  currentLang?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export default function StorageHousekeepingModal({
  isOpen,
  onClose,
  userId,
  logs,
  goals = DEFAULT_GOALS,
  chatHistory,
  onUpdateLogs,
  onUpdateGoals,
  onUpdateChat,
  currentLang = 'en',
  onSelectLanguage
}: StorageHousekeepingModalProps) {
  const [logsStorageKB, setLogsStorageKB] = useState<number>(0);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [photosStorageKB, setPhotosStorageKB] = useState<number>(0);
  const [chatStorageKB, setChatStorageKB] = useState<number>(0);
  const [totalStorageKB, setTotalStorageKB] = useState<number>(0);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Maximum standard browser localStorage quota (~5000 KB = 5 MB)
  const MAX_STORAGE_KB = 5120;

  useEffect(() => {
    if (isOpen) {
      calculateStorageStats();
      setImportError(null);
      const saved = localStorage.getItem('vitalstream_custom_backend_url') || '';
      setBackendUrl(saved);
      setConnectionStatus(null);
    }
  }, [isOpen, logs, chatHistory]);

  const calculateStorageStats = () => {
    let photosSize = 0;
    let photoCount = 0;
    
    // Calculate photos base64 size inside logs
    logs.forEach(log => {
      if (log.photo) {
        photoCount++;
        photosSize += log.photo.length * 2; // UTF-16 bytes approx
      }
    });

    const photoKB = Math.round(photosSize / 1024);
    setPhotosCount(photoCount);
    setPhotosStorageKB(photoKB);

    // Calculate logs size
    const userLogsKey = `health_tracker_logs_${userId}`;
    const rawLogsStr = localStorage.getItem(userLogsKey) || JSON.stringify(logs);
    const logsKB = Math.round((rawLogsStr.length * 2) / 1024);
    setLogsStorageKB(logsKB);

    // Calculate chat size
    const userChatKey = `health_tracker_chat_${userId}`;
    const rawChatStr = localStorage.getItem(userChatKey) || JSON.stringify(chatHistory);
    const chatKB = Math.round((rawChatStr.length * 2) / 1024);
    setChatStorageKB(chatKB);

    // Calculate total localStorage
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
      }
    }
    setTotalStorageKB(Math.round(totalBytes / 1024));
  };

  if (!isOpen) return null;

  // Action 1: Purge Base64 Photo Data (retaining all text, calories & ingredient records)
  const handlePurgePhotos = () => {
    const updated = logs.map(l => {
      if (l.photo && l.photo.startsWith('data:image')) {
        return { ...l, photo: undefined };
      }
      return l;
    });
    onUpdateLogs(updated);
    setActionSuccessMessage(`Purged high-res photo snapshots! Freed ~${photosStorageKB} KB of storage.`);
    setTimeout(() => {
      calculateStorageStats();
      setActionSuccessMessage(null);
    }, 2000);
  };

  // Action 2: Clear Coach Leo AI Chat Memory
  const handleClearChatMemory = () => {
    onUpdateChat([]);
    setActionSuccessMessage(`Cleared Coach Leo AI chat logs (${chatStorageKB} KB freed).`);
    setTimeout(() => {
      calculateStorageStats();
      setActionSuccessMessage(null);
    }, 2000);
  };

  // Action 3: Clear logs older than 30 days
  const handlePurgeOldLogs = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const filtered = logs.filter(l => {
      const logDate = new Date(l.date);
      return logDate >= cutoffDate;
    });

    const countRemoved = logs.length - filtered.length;
    onUpdateLogs(filtered);
    setActionSuccessMessage(`Archived ${countRemoved} logs older than 30 days.`);
    setTimeout(() => {
      calculateStorageStats();
      setActionSuccessMessage(null);
    }, 2000);
  };

  // Action: Export Full Backup JSON
  const handleExportBackup = () => {
    exportHealthBackupJSON(userId, logs, goals);
    setActionSuccessMessage(`Exported ${logs.length} records to backup JSON.`);
    setTimeout(() => setActionSuccessMessage(null), 2500);
  };

  // Action: Restore Backup from JSON File
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate payload structure
        let importedLogs: MetricLog[] = [];
        if (Array.isArray(parsed)) {
          importedLogs = parsed;
        } else if (parsed && Array.isArray(parsed.logs)) {
          importedLogs = parsed.logs;
          if (parsed.goals && onUpdateGoals) {
            onUpdateGoals(parsed.goals);
          }
        } else {
          throw new Error("Invalid backup format. File must contain health logs.");
        }

        // Merge with current logs (deduplicate by id or timestamp+type)
        const existingIds = new Set(logs.map(l => l.id));
        const newRecords = importedLogs.filter(l => l && l.id && !existingIds.has(l.id));
        const merged = [...logs, ...newRecords];

        onUpdateLogs(merged);
        setActionSuccessMessage(`Successfully restored ${newRecords.length} new records! Total history: ${merged.length} logs.`);
        setTimeout(() => {
          calculateStorageStats();
          setActionSuccessMessage(null);
        }, 3000);
      } catch (err: any) {
        setImportError(err.message || "Failed to parse JSON backup file.");
      }
    };
    reader.onerror = () => setImportError("Failed to read the selected backup file.");
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Action: Save and test backend URL
  const handleSaveBackendUrl = (url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    setBackendUrl(clean);
    if (clean) {
      localStorage.setItem('vitalstream_custom_backend_url', clean);
    } else {
      localStorage.removeItem('vitalstream_custom_backend_url');
    }
  };

  const handleTestBackendConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const cleanInput = backendUrl.trim().replace(/\/+$/, '');
      // When in browser preview and no custom override is set, test the direct relative route
      const isWebPreview = typeof window !== 'undefined' && (window.location.hostname.includes('run.app') || window.location.hostname === 'localhost');
      const targetUrl = cleanInput 
        ? `${cleanInput}/api/health` 
        : (isWebPreview ? '/api/health' : `${DEFAULT_HOSTED_BACKEND_URL}/api/health`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(targetUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Returned HTML (like Google login / authorization wall)
        if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("accounts.google.com")) {
          setConnectionStatus({ 
            ok: false, 
            message: `Endpoint redirected to an authentication login page (Google Cloud Run Auth). Please ensure the App is shared or public to allow mobile APK access.` 
          });
          return;
        }
        setConnectionStatus({ 
          ok: false, 
          message: `Unexpected non-JSON response from server (HTTP ${res.status}): ${text.slice(0, 100)}` 
        });
        return;
      }

      if (res.ok) {
        setConnectionStatus({ 
          ok: true, 
          message: `Connected successfully! (Status: ${data?.status || 'OK'}, Target: ${cleanInput || (isWebPreview ? 'Local/Current Session' : DEFAULT_HOSTED_BACKEND_URL)})` 
        });
      } else {
        setConnectionStatus({ ok: false, message: `Server returned HTTP ${res.status} (${res.statusText || 'Error'})` });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setConnectionStatus({ 
          ok: false, 
          message: 'Connection timed out after 10s. The server may be sleeping or unreachable from this mobile network.' 
        });
      } else {
        setConnectionStatus({ 
          ok: false, 
          message: err?.message || 'Network error: Failed to reach the server from this device.' 
        });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  // Action 4: Deep Reset / Factory Clean
  const handleFactoryReset = () => {
    if (confirm("Are you sure you want to clear all local Vitalstream cache and start fresh? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const usagePercent = Math.min(100, Math.round((totalStorageKB / MAX_STORAGE_KB) * 100));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden my-auto">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white/95 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Storage & Housekeeping</h3>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400">Mobile Device Cache & Quota</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-500 hover:text-slate-700 active:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 overscroll-contain">

        {/* Real-time Storage Meter */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              LocalStorage Capacity
            </span>
            <span className="font-mono text-[11px] text-slate-600">
              {totalStorageKB} KB / {MAX_STORAGE_KB} KB ({usagePercent}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(100, (photosStorageKB / MAX_STORAGE_KB) * 100)}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`Meal Photos: ${photosStorageKB} KB`}
            />
            <div 
              style={{ width: `${Math.min(100, (logsStorageKB / MAX_STORAGE_KB) * 100)}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
              title={`Text Logs: ${logsStorageKB} KB`}
            />
            <div 
              style={{ width: `${Math.min(100, (chatStorageKB / MAX_STORAGE_KB) * 100)}%` }} 
              className="bg-indigo-500 h-full transition-all duration-500" 
              title={`AI Chat History: ${chatStorageKB} KB`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Photos ({photosStorageKB} KB)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Logs ({logsStorageKB} KB)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> AI Chat ({chatStorageKB} KB)
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold p-3 rounded-2xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Import Error Alert */}
        {importError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Language Selection Setting */}
        {onSelectLanguage && (
          <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                Language / 语言 / 言語
              </span>
              <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                {currentLang}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Synchronize labels and UI language across this mobile device and web browser.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { code: 'en' as SupportedLanguage, label: 'English', flag: '🇺🇸' },
                { code: 'zh-CN' as SupportedLanguage, label: '简体中文', flag: '🇨🇳' },
                { code: 'zh-TW' as SupportedLanguage, label: '繁體中文', flag: '🇭🇰' },
                { code: 'ja' as SupportedLanguage, label: '日本語', flag: '🇯🇵' },
                { code: 'ko' as SupportedLanguage, label: '한국어', flag: '🇰🇷' },
                { code: 'km' as SupportedLanguage, label: 'ភាសាខ្មែរ', flag: '🇰🇭' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onSelectLanguage(item.code)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentLang === item.code
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cloud Sync & APK Connectivity Settings */}
        <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Cloud & APK Service Endpoint</span>
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Mobile APK Routing
            </span>
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Standalone mobile APKs connect to your hosted Cloud Run instance for Gemini AI Vision and Coach services.
          </p>

          {/* Healthcare App Icon for APK */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/icon.png" 
                alt="Healthcare App Icon" 
                className="w-12 h-12 rounded-xl border border-slate-200 shadow-xs object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>Healthcare App Icon</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">1024×1024</span>
                </p>
                <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">
                  Saved at <code className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded">assets/icon.png</code> for Android APK build.
                </p>
              </div>
            </div>
            <a
              href="/assets/icon.png"
              download="vitalstream_healthcare_icon.png"
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all active:scale-95 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 text-[9.5px] text-amber-900 leading-snug">
            <span className="font-bold">Important for Android APK:</span> Cloud Run URLs (<code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">ais-dev</code> / <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">ais-pre</code>) require the applet to be <span className="font-bold">Shared / Deployed</span> via the top-right AI Studio menu to allow public unauthenticated mobile access.
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleSaveBackendUrl('https://ais-pre-k6z4f6wcf5vfsnc6wxywm7-469255650912.asia-southeast1.run.app')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Shared Pre URL
            </button>
            <button
              type="button"
              onClick={() => handleSaveBackendUrl('https://ais-dev-k6z4f6wcf5vfsnc6wxywm7-469255650912.asia-southeast1.run.app')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Dev URL
            </button>
            <button
              type="button"
              onClick={() => handleSaveBackendUrl('')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[9px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Auto (Default)
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => handleSaveBackendUrl(e.target.value)}
                  placeholder={DEFAULT_HOSTED_BACKEND_URL}
                  className="w-full pl-3 pr-8 py-2 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-700 select-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = backendUrl || DEFAULT_HOSTED_BACKEND_URL;
                    navigator.clipboard?.writeText(textToCopy);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  title="Copy URL"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                >
                  {copiedUrl ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <button
                onClick={handleTestBackendConnection}
                disabled={testingConnection}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
              >
                {testingConnection ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5" />
                )}
                <span>Test Link</span>
              </button>
            </div>

            {connectionStatus && (
              <div className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 ${
                connectionStatus.ok 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {connectionStatus.ok ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                )}
                <span className="break-all">{connectionStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Backup & Restore Tools Section */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Data Preservation & APK Upgrade Backup
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Export JSON Backup */}
            <button
              onClick={handleExportBackup}
              className="p-3 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                <Download className="w-4 h-4" />
                <span>Save Backup JSON</span>
              </div>
              <span className="text-[9px] text-emerald-900/70 font-semibold leading-tight">
                Download {logs.length} records to keep before re-installing APK
              </span>
            </button>

            {/* Restore JSON Backup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-xs">
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
              </div>
              <span className="text-[9px] text-indigo-900/70 font-semibold leading-tight">
                Import previously saved .json backup file
              </span>
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportBackup}
            />
          </div>
        </div>

        {/* Housekeeping Action Tools */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Recommended Cleaning Actions
          </span>

          {/* Action 1: Purge Heavy Photos */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Image className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Compress / Purge Meal Photos</p>
                <p className="text-[10px] text-slate-500">
                  {photosCount > 0 ? `${photosCount} images taking ~${photosStorageKB} KB` : 'No heavy image snapshots stored'}
                </p>
              </div>
            </div>
            <button
              onClick={handlePurgePhotos}
              disabled={photosCount === 0}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-extrabold uppercase rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Clean Photos
            </button>
          </div>

          {/* Action 2: Clear AI Chat Memory */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Clear Coach Leo Chat Memory</p>
                <p className="text-[10px] text-slate-500">
                  {chatHistory.length > 0 ? `${chatHistory.length} messages (${chatStorageKB} KB)` : 'Chat memory is empty'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearChatMemory}
              disabled={chatHistory.length === 0}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-extrabold uppercase rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Clear Chat
            </button>
          </div>

          {/* Action 3: Archive logs older than 30 days */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Trim Logs Older Than 30 Days</p>
                <p className="text-[10px] text-slate-500">Keeps recent metrics & clears outdated records</p>
              </div>
            </div>
            <button
              onClick={handlePurgeOldLogs}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Trim Old
            </button>
          </div>
        </div>

        {/* Footer info & Factory reset button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleFactoryReset}
            className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-[10px] font-bold uppercase transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Factory Storage Reset</span>
          </button>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% On-Device Privacy</span>
          </div>
        </div>

        </div>

        {/* Sticky Footer Dismiss Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-sm text-center"
          >
            Done / Close Modal
          </button>
        </div>

      </div>
    </div>
  );
}
