import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Zap, 
  Crown, 
  CreditCard, 
  ShieldCheck, 
  Camera, 
  Brain, 
  Heart, 
  Cloud, 
  ArrowRight 
} from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'free' | 'pro' | 'payg';
  credits: number;
  onSelectTier: (tier: 'free' | 'pro' | 'payg', newCredits?: number) => void;
}

export default function ProUpgradeModal({
  isOpen,
  onClose,
  currentTier,
  credits,
  onSelectTier
}: ProUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'payg'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = (plan: 'pro' | 'payg') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (plan === 'pro') {
        onSelectTier('pro');
        setSuccessMessage('🎉 Successfully upgraded to Vitalstream Pro Unlimited Tier!');
      } else {
        const updatedCredits = credits + 30;
        onSelectTier('payg', updatedCredits);
        setSuccessMessage(`⚡ Successfully added 30 Pay-As-You-Go credits! (Total: ${updatedCredits} credits)`);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
        
        {/* Glowing Top Banner Background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-600">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                Vitalstream Monetization & Plans
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">Choose the flexible health tracking plan for you</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Plan Badge */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <span className="text-slate-400 font-medium">Your Active Tier:</span>
            {currentTier === 'pro' && (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 fill-white" /> Pro Unlimited
              </span>
            )}
            {currentTier === 'payg' && (
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white" /> Pay-As-You-Go ({credits} Credits)
              </span>
            )}
            {currentTier === 'free' && (
              <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                Free Starter Plan
              </span>
            )}
          </div>
          {currentTier !== 'free' && (
            <button
              onClick={() => onSelectTier('free')}
              className="text-[9px] font-extrabold text-slate-400 hover:text-rose-600 uppercase underline cursor-pointer"
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black p-3.5 rounded-2xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Card 1: Pro Unlimited Subscription Tier */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`border-2 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all relative ${
              selectedPlan === 'pro' 
                ? 'border-amber-500 bg-amber-50/30 shadow-md scale-[1.02]' 
                : 'border-slate-200 hover:border-amber-300 bg-white'
            }`}
          >
            <div className="absolute top-3 right-3">
              <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                Most Popular
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h4 className="text-sm font-extrabold text-slate-900">Pro Tier</h4>
              </div>

              <div>
                <span className="text-2xl font-black text-slate-900">$9.99</span>
                <span className="text-xs font-semibold text-slate-500"> / month</span>
              </div>

              <ul className="space-y-1.5 pt-2 text-[10px] font-bold text-slate-600">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Unlimited AI Food Lens Scans
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Unlimited Coach Leo AI Chats
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Real-time Optical PPG HRV
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Export PDF Health Reports
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('pro');
              }}
              disabled={isProcessing || currentTier === 'pro'}
              className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {currentTier === 'pro' ? 'Active Plan' : isProcessing ? 'Processing...' : 'Subscribe $9.99/mo'}
            </button>
          </div>

          {/* Card 2: Pay-As-You-Go Credits Option */}
          <div 
            onClick={() => setSelectedPlan('payg')}
            className={`border-2 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all relative ${
              selectedPlan === 'payg' 
                ? 'border-indigo-600 bg-indigo-50/30 shadow-md scale-[1.02]' 
                : 'border-slate-200 hover:border-indigo-300 bg-white'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Pay-As-You-Go</h4>
              </div>

              <div>
                <span className="text-2xl font-black text-slate-900">$2.99</span>
                <span className="text-xs font-semibold text-slate-500"> / 30 scans</span>
              </div>

              <ul className="space-y-1.5 pt-2 text-[10px] font-bold text-slate-600">
                <li className="flex items-center gap-1.5 text-indigo-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> $0.10 per Gemini AI Vision scan
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Pay only when you use AI
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Credits never expire
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Perfect for casual logging
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('payg');
              }}
              disabled={isProcessing}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {isProcessing ? 'Processing...' : 'Buy 30 Credits ($2.99)'}
            </button>
          </div>

        </div>

        {/* Guarantee & Security Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime with 1-click
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Secure Checkout
          </span>
        </div>

      </div>
    </div>
  );
}
