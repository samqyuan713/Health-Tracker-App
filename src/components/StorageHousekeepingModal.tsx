import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, Image, MessageSquare, Database, RefreshCw, Check, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { MetricLog, ChatMessage } from '../types';

interface StorageHousekeepingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  logs: MetricLog[];
  chatHistory: ChatMessage[];
  onUpdateLogs: (logs: MetricLog[]) => void;
  onUpdateChat: (chat: ChatMessage[]) => void;
}

export default function StorageHousekeepingModal({
  isOpen,
  onClose,
  userId,
  logs,
  chatHistory,
  onUpdateLogs,
  onUpdateChat
}: StorageHousekeepingModalProps) {
  const [logsStorageKB, setLogsStorageKB] = useState<number>(0);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [photosStorageKB, setPhotosStorageKB] = useState<number>(0);
  const [chatStorageKB, setChatStorageKB] = useState<number>(0);
  const [totalStorageKB, setTotalStorageKB] = useState<number>(0);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Maximum standard browser localStorage quota (~5000 KB = 5 MB)
  const MAX_STORAGE_KB = 5120;

  useEffect(() => {
    if (isOpen) {
      calculateStorageStats();
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

  // Action 4: Deep Reset / Factory Clean
  const handleFactoryReset = () => {
    if (confirm("Are you sure you want to clear all local Vitalstream cache and start fresh? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const usagePercent = Math.min(100, Math.round((totalStorageKB / MAX_STORAGE_KB) * 100));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 relative select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Storage & Housekeeping</h3>
              <p className="text-[11px] font-semibold text-slate-400">Mobile Device Cache & Quota Management</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {/* Housekeeping Action Tools */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Recommended Cleaning Actions
          </span>

          {/* Action 1: Purge Heavy Photos */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all">
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
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all">
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
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all">
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
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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
    </div>
  );
}
