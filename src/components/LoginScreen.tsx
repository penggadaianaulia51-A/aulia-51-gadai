import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { Shield, User, Lock, Key, Eye, EyeOff, LogIn, Sparkles, Building2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginAppUser, settings, userAccounts } = useSync();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginAppUser(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Username atau Password salah!');
      }
    }, 300);
  };

  const fillQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Store Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
            A51
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              {settings.namaToko || 'AULIA 51 GADAI'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Sistem Manajemen Penggadaian Terintegrasi
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password Kata Sandi
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> MASUK KE SISTEM
              </>
            )}
          </button>
        </form>

        {/* Available User Credentials Hint */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span className="uppercase tracking-wider">Pilih Akun Demo / Tersedia:</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin', 'admin123')}
              className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition text-xs group"
            >
              <div className="font-bold text-purple-300 group-hover:text-purple-200 flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-400" /> Admin Utama
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin / admin123</div>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('kasir', 'kasir123')}
              className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition text-xs group"
            >
              <div className="font-bold text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-400" /> Kasir Toko
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">kasir / kasir123</div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-1">
          &copy; {new Date().getFullYear()} {settings.namaToko || 'Aulia 51 Gadai'}. All rights reserved.
        </div>
      </div>
    </div>
  );
};
