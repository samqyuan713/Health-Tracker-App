import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  X, 
  CheckCircle2, 
  LogOut, 
  User, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchUser: (newUser: UserProfile) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser
}: AuthModalProps) {
  const [view, setView] = useState<'profile' | 'google-signin' | 'manual-input'>('profile');
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [isSimulatingAuth, setIsSimulatingAuth] = useState(false);

  if (!isOpen) return null;

  // Preset Google Accounts for quick testing & account switching
  const presetGoogleAccounts: UserProfile[] = [
    {
      id: 'google_qyuan_sam',
      name: 'Sam Yuan',
      email: 'qyuan.sam@gmail.com',
      authProvider: 'google',
      signedInAt: new Date().toISOString()
    },
    {
      id: 'google_alex_hen',
      name: 'Alex Henderson',
      email: 'alex.henderson@gmail.com',
      authProvider: 'google',
      signedInAt: new Date().toISOString()
    },
    {
      id: 'google_dr_sarah',
      name: 'Dr. Sarah Lin, MD',
      email: 'sarah.lin.md@gmail.com',
      authProvider: 'google',
      signedInAt: new Date().toISOString()
    }
  ];

  const handleSelectPreset = (user: UserProfile) => {
    setIsSimulatingAuth(true);
    setTimeout(() => {
      setIsSimulatingAuth(false);
      onSwitchUser(user);
      setView('profile');
      onClose();
    }, 600);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail) return;

    const emailClean = inputEmail.trim().toLowerCase();
    const derivedName = inputName.trim() || emailClean.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const derivedId = `google_${emailClean.replace(/[^a-z0-9]/g, '_')}`;

    const newUser: UserProfile = {
      id: derivedId,
      name: derivedName,
      email: emailClean,
      authProvider: 'google',
      signedInAt: new Date().toISOString()
    };

    setIsSimulatingAuth(true);
    setTimeout(() => {
      setIsSimulatingAuth(false);
      onSwitchUser(newUser);
      setView('profile');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              V
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 leading-tight">Google ID Health Access</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account & Data Synchronization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {view === 'profile' && (
            <div className="space-y-5">
              
              {/* Active User Card */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl relative overflow-hidden">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-md">
                        Active Profile
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Google Verified
                      </span>
                    </div>

                    <p className="text-base font-black text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>User ID Key: <code className="text-emerald-800 font-mono">{currentUser.id}</code></span>
                  <span className="text-emerald-700">Health Data Isolated</span>
                </div>
              </div>

              {/* Data isolation note */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Account Health Isolation
                </p>
                <p className="text-[11px] text-slate-500">
                  Your daily steps, food logs, water, sleep stats, and AI Coach conversations are securely connected to <span className="font-bold text-slate-700">{currentUser.email}</span>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setView('google-signin')}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  {/* Google standard colorful icon SVG */}
                  <svg className="w-4 h-4 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In / Switch Google Account</span>
                </button>

                <button
                  onClick={() => setView('manual-input')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" /> Enter Custom Google ID / Email
                </button>
              </div>

            </div>
          )}

          {view === 'google-signin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Choose a Google Account</p>
                <button 
                  onClick={() => setView('profile')}
                  className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              {isSimulatingAuth ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-700">Authenticating with Google OAuth 2.0...</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validating security tokens</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {presetGoogleAccounts.map((acc) => {
                    const isActive = acc.email === currentUser.email;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSelectPreset(acc)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isActive 
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' 
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {acc.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">{acc.name}</p>
                            <p className="text-[11px] font-medium text-slate-500">{acc.email}</p>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      onClick={() => setView('manual-input')}
                      className="w-full py-3 border border-dashed border-slate-300 hover:border-slate-400 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" /> Use another Google Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'manual-input' && (
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Connect Custom Google ID</p>
                <button 
                  type="button"
                  onClick={() => setView('profile')}
                  className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. qyuan.sam@gmail.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sam Yuan"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSimulatingAuth || !inputEmail}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isSimulatingAuth ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting Google ID...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize & Switch Account</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Protected by Google Identity SSL & HIPAA Health Privacy Protocol
          </p>
        </div>

      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
