import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { AlertTriangle, CheckCircle2, RefreshCw, Key, ExternalLink, LogIn, User } from 'lucide-react';

export const WarningBanner: React.FC = () => {
  const { syncState, loginWithGoogle, connectGoogleToken, disconnectGoogle, settings } = useSync();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const success = await loginWithGoogle();
    setLoading(false);
    if (!success) {
      setErrorMsg('Gagal melakukan login Google OAuth. Silakan coba lagi.');
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenValue.trim()) return;
    setLoading(true);
    setErrorMsg('');
    const success = await connectGoogleToken(tokenValue.trim());
    setLoading(false);
    if (success) {
      setShowTokenInput(false);
      setTokenValue('');
    } else {
      setErrorMsg('Token tidak valid atau tidak dapat mengakses Google Sheet ID tersebut.');
    }
  };

  if (syncState.isConnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex flex-wrap items-center justify-between shadow-sm border-b border-emerald-700">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          {syncState.userPicture ? (
            <img src={syncState.userPicture} alt="Avatar" className="w-5 h-5 rounded-full border border-white" />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span>
            <b>SINKRON OTOMATIS:</b> {syncState.userEmail || syncState.userName || 'Terhubung Google Sheet & Drive'}
          </span>
          <span className="hidden md:inline bg-emerald-800/80 text-emerald-100 px-2 py-0.5 rounded text-[11px]">
            Sheet ID: {settings.googleSheetId.substring(0, 10)}...
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <a
            href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 text-emerald-100 hover:text-white"
          >
            Buka Sheet <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={disconnectGoogle}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
          >
            Putuskan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-600 text-white px-4 py-3 text-xs md:text-sm font-semibold shadow-md border-b-2 border-red-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-200 mt-0.5" />
          <div>
            <div className="font-bold text-sm md:text-base tracking-wide uppercase">
              ⚠️ PERINGATAN: APLIKASI BELUM SINKRON DENGAN GOOGLE SHEET & GOOGLE DRIVE!
            </div>
            <div className="text-red-100 text-xs font-normal mt-0.5">
              Klik <b>"Login Akun Google"</b> di bawah ini untuk mengambil token otomatis dan menghubungkan Google Sheets & Drive tanpa input manual.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          {/* Main Automatic Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="bg-white text-slate-900 hover:bg-emerald-50 font-extrabold px-4 py-2 rounded-xl shadow-lg text-xs md:text-sm flex items-center gap-2 transition uppercase tracking-wider border-2 border-amber-300 hover:border-amber-400 active:scale-95"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <LogIn className="w-4 h-4 text-emerald-600" />
            )}
            LOGIN AKUN GOOGLE (OTOMATIS)
          </button>

          {/* Toggle manual fallback if ever needed */}
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="bg-red-800/80 hover:bg-red-900 text-red-100 font-semibold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1 transition"
            title="Manual Token Input (Opsional)"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showTokenInput && (
        <div className="max-w-7xl mx-auto mt-3 p-3 bg-red-700 rounded-lg border border-red-500 text-white font-normal">
          <p className="text-xs mb-2">
            Pilihan Alternatif: Masukkan <b>Google Access Token</b> secara manual jika diperlukan:
          </p>
          <form onSubmit={handleConnectManual} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Tempel Google Access Token di sini (ya29...)"
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs text-gray-900 rounded border border-red-300 focus:outline-none bg-white font-mono"
            />
            <button
              type="submit"
              disabled={loading || !tokenValue.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verifikasi Manual'}
            </button>
          </form>
          {errorMsg && <p className="text-amber-200 text-xs font-bold mt-2">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
};
