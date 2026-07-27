import React, { useState, useEffect } from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-0 md:p-1 selection:bg-emerald-500 selection:text-white transition-all duration-300">
      {/* Outer Mock Device for Desktop Layouts */}
      <div id="device-wrapper" className="w-full max-w-[360px] h-full max-h-[640px] sm:max-h-[680px] md:max-h-[720px] rounded-[24px] md:rounded-[40px] md:border-[10px] md:border-slate-800 bg-white relative flex flex-col overflow-hidden shadow-2xl transition-all border-slate-900">
        
        {/* Device Status Bar */}
        <div id="phone-status-bar" className="w-full h-8 flex justify-between items-center px-6 relative z-40 select-none text-[10px] font-bold text-slate-800 shrink-0 bg-white border-b border-slate-50">
          <span className="font-bold text-slate-700">{time}</span>
        </div>

        {/* Main Application Area (using light theme background) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/60">
          {children}
        </div>

        {/* Home Swipe Indicator on Desktop */}
        <div className="hidden md:flex w-full h-4 bg-white items-center justify-center select-none relative z-40 shrink-0">
          <div className="w-20 h-1 bg-slate-300 rounded-full opacity-80"></div>
        </div>

      </div>
    </div>
  );
}
