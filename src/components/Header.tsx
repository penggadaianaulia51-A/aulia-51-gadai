import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import {
  UserPlus,
  PlusCircle,
  Clock,
  CheckSquare,
  PackageCheck,
  BarChart3,
  Printer,
  Settings,
  LayoutDashboard,
  CloudOff,
  CloudCheck,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  LogIn,
  User,
  Shield,
  Key,
  Lock,
  LogOut
} from 'lucide-react';

export type ActiveTab =
  | 'DASHBOARD'
  | 'INPUT_NASABAH'
  | 'GADAI_BARU'
  | 'PERPANJANG'
  | 'PELUNASAN'
  | 'BARANG_JAMINAN'
  | 'LAPORAN'
  | 'CETAK_ULANG'
  | 'PENGATURAN';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    syncState,
    settings,
    loginWithGoogle,
    activeUser,
    hasPermission,
    loginAppUser,
    logoutAppUser
  } = useSync();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const isConnected = syncState.isConnected;

  const allNavGroups: {
    title: string;
    items: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[];
  }[] = [
    {
      title: 'UTAMA',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'OPERASIONAL GADAI',
      items: [
        { id: 'INPUT_NASABAH', label: 'Nasabah Baru', icon: <UserPlus className="w-4 h-4" /> },
        { id: 'GADAI_BARU', label: 'Gadai Baru', icon: <PlusCircle className="w-4 h-4" /> },
        { id: 'PERPANJANG', label: 'Perpanjang Akad', icon: <Clock className="w-4 h-4" /> },
        { id: 'PELUNASAN', label: 'Pelunasan Gadai', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'BARANG_JAMINAN', label: 'Barang Jaminan', icon: <PackageCheck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REKAP & LAPORAN',
      items: [
        { id: 'LAPORAN', label: 'Laporan & Analisis', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'CETAK_ULANG', label: 'Cetak Ulang Nota', icon: <Printer className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'PENGATURAN', label: 'Pengaturan System', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  // Filter items based on active user's permissions
  const navGroups = allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const handleExecuteAppLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = loginAppUser(usernameInput, passwordInput);
    if (res.success) {
      setShowLoginModal(false);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError(res.error || 'Login gagal.');
    }
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Brand & Logo Header */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner shrink-0 ${
                isConnected
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : 'bg-gradient-to-br from-red-600 to-rose-700 text-white animate-bounce'
              }`}
            >
              A51
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm md:text-base tracking-tight truncate text-white flex items-center gap-1.5">
                {settings.namaToko}
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-400/30 shrink-0">
                  v2.5
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-light truncate">
                Sistem Manajemen Gadai
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active System User Profile Badge */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                {activeUser?.namaLengkap || 'Pengguna'}
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                    activeUser?.role === 'ADMIN'
                      ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40'
                      : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40'
                  }`}
                >
                  {activeUser?.role || 'KASIR'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">@{activeUser?.username || 'user'}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 px-1.5 py-1 rounded-lg transition"
              title="Ganti Pengguna"
            >
              Switch
            </button>
            <button
              onClick={logoutAppUser}
              className="text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 px-1.5 py-1 rounded-lg transition flex items-center gap-1"
              title="Keluar Sesi / Logout"
            >
              <LogOut className="w-3 h-3" /> Keluar
            </button>
          </div>
        </div>

        {/* Navigation Group Items */}
        <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] no-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                        isActive
                          ? isConnected
                            ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50 ring-1 ring-blue-400/40'
                            : 'bg-red-600 text-white font-bold shadow-lg shadow-red-900/50 ring-1 ring-red-400/40'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/80" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Account & Sync Status Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 mt-auto">
        {isConnected ? (
          <div className="p-2.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2.5">
              {syncState.userPicture ? (
                <img
                  src={syncState.userPicture}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-emerald-400 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  G
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 truncate">
                  <CloudCheck className="w-3.5 h-3.5 shrink-0" /> Tersambung Google
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  {syncState.userEmail || 'penggadaianaulia51@gmail.com'}
                </div>
              </div>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-semibold transition border border-emerald-800/50"
            >
              Buka Google Sheet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-900/90 border border-red-500/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-red-400 shrink-0" />
              <div className="text-[11px] font-bold text-red-400">Belum Terhubung Google</div>
            </div>
            <button
              onClick={loginWithGoogle}
              className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition shadow"
            >
              <LogIn className="w-3.5 h-3.5" /> Login Google
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs">
              A51
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">{settings.namaToko}</span>
          </div>
        </div>

        {/* Sync Indicator Pill */}
        <div className="flex items-center gap-1">
          {isConnected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CloudCheck className="w-3 h-3 text-emerald-400" /> SINKRON
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40 flex items-center gap-1">
              <CloudOff className="w-3 h-3 text-red-400" /> DISCONNECT
            </span>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-white h-full z-10 flex flex-col shadow-2xl border-r border-slate-800">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 bg-slate-900 text-white border-r border-slate-800 shadow-2xl z-20 print:hidden">
        {renderNavContent()}
      </aside>

      {/* User Login / Switch Account Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ganti User / Login Sistem</h3>
                  <p className="text-[11px] text-gray-500">Masuk sesuai akun & hak akses Anda</p>
                </div>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAppLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: admin / kasir"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Lock className="w-3.5 h-3.5" /> Login Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
