import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { AppSettings, UserAccount } from '../types';
import {
  Settings,
  RefreshCw,
  CheckCircle2,
  Shield,
  MessageSquare,
  Mail,
  Printer,
  Users,
  Key,
  Save,
  LogIn,
  User,
  Table,
  RotateCcw,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  X,
  CheckSquare
} from 'lucide-react';

export const ALL_PERMISSIONS: { key: string; label: string; desc: string }[] = [
  { key: 'DASHBOARD', label: '1. Dashboard Utama', desc: 'Melihat ringkasan statistik & indikator gadai aktif' },
  { key: 'INPUT_NASABAH', label: '2. Registrasi Nasabah Baru', desc: 'Menambah data & identitas nasabah baru' },
  { key: 'GADAI_BARU', label: '3. Transaksi Gadai Baru', desc: 'Membuat akad gadai baru & cetak nota awal' },
  { key: 'PERPANJANG', label: '4. Perpanjang Akad', desc: 'Memproses perpanjangan durasi gadai 14 hari' },
  { key: 'PELUNASAN', label: '5. Pelunasan / Tebus Barang', desc: 'Memproses pelunasan pokok & tebus barang' },
  { key: 'BARANG_JAMINAN', label: '6. Daftar Barang Jaminan', desc: 'Melihat & mencari status barang jaminan' },
  { key: 'LAPORAN', label: '7. Laporan & Analisis', desc: 'Melihat rekap keuangan, kas keluar/masuk & laporan' },
  { key: 'CETAK_ULANG', label: '8. Cetak Ulang Nota', desc: 'Mencetak ulang nota gadai, perpanjang, & pelunasan' },
  { key: 'PENGATURAN', label: '9. Pengaturan System & User', desc: 'Mengatur profil toko, parameter gadai, & akun user' },
  { key: 'HAPUS_TRANSAKSI', label: '10. Hapus / Batalkan Transaksi', desc: 'Otorisasi membatalkan atau menghapus transaksi gadai' },
];

export const PengaturanView: React.FC = () => {
  const {
    settings,
    updateSettings,
    syncState,
    loginWithGoogle,
    connectGoogleToken,
    initSheetHeaders,
    resetSpreadsheetData,
    userAccounts,
    activeUser,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount
  } = useSync();

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [tokenInput, setTokenInput] = useState('');
  const [isInitializingSheet, setIsInitializingSheet] = useState(false);
  const [isFixingHeaders, setIsFixingHeaders] = useState(false);
  const [isResettingSheet, setIsResettingSheet] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // User management modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form fields for user modal
  const [modalUsername, setModalUsername] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalNamaLengkap, setModalNamaLengkap] = useState('');
  const [modalRole, setModalRole] = useState<'ADMIN' | 'KASIR' | 'MANAGER'>('KASIR');
  const [modalHakAkses, setModalHakAkses] = useState<string[]>(['DASHBOARD', 'INPUT_NASABAH', 'GADAI_BARU', 'PERPANJANG', 'PELUNASAN', 'BARANG_JAMINAN', 'CETAK_ULANG']);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveMessage('Pengaturan berhasil disimpan!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleGoogleLogin = async () => {
    setIsInitializingSheet(true);
    const success = await loginWithGoogle();
    setIsInitializingSheet(false);
    if (success) {
      alert('Berhasil login & terhubung ke Google Sheet & Drive!');
    } else {
      alert('Gagal melakukan login Google OAuth.');
    }
  };

  const handleFixHeaders = async () => {
    setIsFixingHeaders(true);
    const success = await initSheetHeaders();
    setIsFixingHeaders(false);
    if (success) {
      alert('Berhasil membuat & memperbarui Header Kolom di Google Spreadsheet!');
    } else {
      alert('Gagal memperbarui header kolom. Pastikan Anda sudah login akun Google.');
    }
  };

  const handleResetSpreadsheet = async () => {
    const confirmReset = window.confirm(
      '⚠️ KONFIRMASI RISET SPREADSHEET:\n\nApakah Anda yakin ingin menghapus seluruh isi Google Spreadsheet dan membangun ulang struktur kolom dari awal?'
    );
    if (!confirmReset) return;

    setIsResettingSheet(true);
    const res = await resetSpreadsheetData();
    setIsResettingSheet(false);

    if (res.success) {
      alert('✅ RISET BERHASIL!\n\nGoogle Spreadsheet telah dibersihkan dan dibangun ulang secara rapi.');
    } else {
      alert('❌ GAGAL RISET SPREADSHEET:\n\n' + (res.error || 'Terjadi kesalahan.'));
    }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsInitializingSheet(true);
    const success = await connectGoogleToken(tokenInput.trim());
    setIsInitializingSheet(false);
    if (success) {
      alert('Berhasil terhubung ke Google Sheet & Drive!');
      setTokenInput('');
    } else {
      alert('Gagal menghubungkan token Google.');
    }
  };

  // Open modal for new user
  const handleOpenNewUserModal = () => {
    setEditingUser(null);
    setModalUsername('');
    setModalPassword('123456');
    setModalNamaLengkap('');
    setModalRole('KASIR');
    setModalHakAkses(['DASHBOARD', 'INPUT_NASABAH', 'GADAI_BARU', 'PERPANJANG', 'PELUNASAN', 'BARANG_JAMINAN', 'CETAK_ULANG']);
    setModalError(null);
    setUserModalOpen(true);
  };

  // Open modal for editing user
  const handleOpenEditUserModal = (user: UserAccount) => {
    setEditingUser(user);
    setModalUsername(user.username);
    setModalPassword(user.password || '');
    setModalNamaLengkap(user.namaLengkap);
    setModalRole(user.role);
    setModalHakAkses(user.hakAkses || []);
    setModalError(null);
    setUserModalOpen(true);
  };

  const handleTogglePermission = (permKey: string) => {
    if (modalHakAkses.includes(permKey)) {
      setModalHakAkses(modalHakAkses.filter((k) => k !== permKey));
    } else {
      setModalHakAkses([...modalHakAkses, permKey]);
    }
  };

  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalUsername.trim() || !modalPassword.trim() || !modalNamaLengkap.trim()) {
      setModalError('Username, Password, dan Nama Lengkap wajib diisi!');
      return;
    }

    if (editingUser) {
      const res = updateUserAccount({
        ...editingUser,
        username: modalUsername.trim(),
        password: modalPassword.trim(),
        namaLengkap: modalNamaLengkap.trim(),
        role: modalRole,
        hakAkses: modalRole === 'ADMIN' ? ['ALL', ...ALL_PERMISSIONS.map((p) => p.key)] : modalHakAkses,
      });
      if (res.success) {
        setUserModalOpen(false);
      } else {
        setModalError(res.error || 'Gagal mengubah user.');
      }
    } else {
      const res = addUserAccount({
        username: modalUsername.trim(),
        password: modalPassword.trim(),
        namaLengkap: modalNamaLengkap.trim(),
        role: modalRole,
        hakAkses: modalRole === 'ADMIN' ? ['ALL', ...ALL_PERMISSIONS.map((p) => p.key)] : modalHakAkses,
      });
      if (res.success) {
        setUserModalOpen(false);
      } else {
        setModalError(res.error || 'Gagal menambahkan user.');
      }
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user @${user.username} (${user.namaLengkap})?`)) {
      const res = deleteUserAccount(user.id);
      if (!res.success) {
        alert(res.error || 'Gagal menghapus user.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <Settings className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pengaturan System & Otorisasi Hak Akses</h2>
            <p className="text-xs text-blue-200">
              Kelola profil toko, parameter gadai, Google Sync, serta User Account & Hak Akses
            </p>
          </div>
        </div>

        {saveMessage && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow">
            <CheckCircle2 className="w-4 h-4" /> {saveMessage}
          </div>
        )}
      </div>

      {/* 1. Google Cloud Sync Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" /> Integrasi Google Sheet & Drive
          </h3>
          <div className="flex items-center gap-2">
            {syncState.isConnected ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> STATUS: TERHUBUNG
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-300">
                <Shield className="w-3 h-3 text-red-600" /> STATUS: TERPUTUS
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Google Spreadsheet ID</label>
            <input
              type="text"
              value={formData.googleSheetId}
              onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Google Drive Folder ID</label>
            <input
              type="text"
              value={formData.googleDriveFolderId}
              onChange={(e) => setFormData({ ...formData, googleDriveFolderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isInitializingSheet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              {isInitializingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />} Login Google OAuth
            </button>

            <button
              type="button"
              onClick={handleFixHeaders}
              disabled={isFixingHeaders}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              {isFixingHeaders ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />} Fix Header Kolom
            </button>

            <button
              type="button"
              onClick={handleResetSpreadsheet}
              disabled={isResettingSheet}
              className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-rose-300"
            >
              {isResettingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Riset Spreadsheet
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-blue-700 font-bold hover:underline"
          >
            {showManualInput ? 'Sembunyikan Token Manual' : 'Input Token Manual?'}
          </button>
        </div>

        {showManualInput && (
          <form onSubmit={handleConnectToken} className="pt-2 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tempel Access Token (ya29...)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
              />
              <button
                type="submit"
                disabled={isInitializingSheet}
                className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                Connect
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. User Account & Permission Access Settings (FITUR BARU) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Manajemen User Account & Password Otorisasi
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Atur username, password login, role, serta batasi menu/fitur yang diizinkan untuk dibuka setiap kasir/admin.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewUserModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0"
          >
            <Plus className="w-4 h-4" /> + Tambah User Baru
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">User ID & Username</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Password</th>
                <th className="p-3">Role</th>
                <th className="p-3">Hak Akses Menu</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {userAccounts.map((u) => {
                const isShowPass = showPasswordMap[u.id] || false;
                const isCurrentActive = activeUser?.id === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${isCurrentActive ? 'bg-blue-50/60' : ''}`}>
                    <td className="p-3">
                      <div className="font-bold font-mono text-blue-900 flex items-center gap-1.5">
                        @{u.username}
                        {isCurrentActive && (
                          <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{u.id}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{u.namaLengkap}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-1 rounded w-fit border border-gray-200">
                        <span>{isShowPass ? u.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(u.id)}
                          className="text-gray-500 hover:text-slate-900"
                          title={isShowPass ? 'Sembunyikan' : 'Tampilkan Password'}
                        >
                          {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.role === 'ADMIN' || u.hakAkses.includes('ALL') ? (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            ★ SEMUA HAK AKSES (ADMIN)
                          </span>
                        ) : (
                          u.hakAkses.map((hk) => (
                            <span key={hk} className="text-[10px] font-semibold bg-gray-100 text-slate-700 px-1.5 py-0.5 rounded border border-gray-200">
                              {hk}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUserModal(u)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        title="Edit User & Hak Akses"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg transition"
                        title="Hapus User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Profil Toko & Parameter Gadai Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b pb-2">
            Profil Usaha & Parameter Aturan Gadai
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Nama Toko / Usaha</label>
              <input
                type="text"
                value={formData.namaToko}
                onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">No HP / WhatsApp Toko</label>
              <input
                type="text"
                value={formData.noHpToko}
                onChange={(e) => setFormData({ ...formData, noHpToko: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">Alamat Toko</label>
              <input
                type="text"
                value={formData.alamatToko}
                onChange={(e) => setFormData({ ...formData, alamatToko: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Administrasi (%) per 14 Hari</label>
              <input
                type="number"
                step="0.1"
                value={formData.adminPersen}
                onChange={(e) => setFormData({ ...formData, adminPersen: parseFloat(e.target.value) || 7 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Denda Keterlambatan (%) / Hari</label>
              <input
                type="number"
                step="0.1"
                value={formData.dendaPersenPerHari}
                onChange={(e) => setFormData({ ...formData, dendaPersenPerHari: parseFloat(e.target.value) || 0.8 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-rose-700"
              />
            </div>
          </div>
        </div>

        {/* 4. Setting Printer & Struk Nota */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" /> Ukuran Nota & Printer (108mm x 165mm)
          </h3>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            ✅ Layout Struk & Nota telah dikunci secara presisi pada ukuran <b>108mm x 165mm</b> siap cetak thermal/standard dengan CSS `@media print` tanpa header/footer browser.
          </div>

          <div>
            <label className="block font-bold text-xs text-gray-700 mb-1">Syarat & Ketentuan Struk Nota</label>
            <textarea
              rows={3}
              value={formData.syaratKetentuan}
              onChange={(e) => setFormData({ ...formData, syaratKetentuan: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> SIMPAN PENGATURAN SYSTEM
          </button>
        </div>
      </form>

      {/* User Create/Edit Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUser ? `Edit User & Hak Akses @${editingUser.username}` : 'Tambah User Account Baru'}
                  </h3>
                  <p className="text-xs text-gray-500">Tentukan username, password, dan izin menu</p>
                </div>
              </div>
              <button onClick={() => setUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Username Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: kasir1"
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan password..."
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nama Lengkap User <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kasir Budi Santoso"
                    value={modalNamaLengkap}
                    onChange={(e) => setModalNamaLengkap(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Role Jabatan</label>
                  <select
                    value={modalRole}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setModalRole(r);
                      if (r === 'ADMIN') {
                        setModalHakAkses(['ALL', ...ALL_PERMISSIONS.map((p) => p.key)]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold bg-white"
                  >
                    <option value="KASIR">KASIR (Staf Operasional)</option>
                    <option value="MANAGER">MANAGER (Pengawas)</option>
                    <option value="ADMIN">ADMIN (Full Control / Bebas)</option>
                  </select>
                </div>
              </div>

              {/* Hak Akses Checkboxes Grid */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-900 uppercase">
                    Otorisasi Hak Akses Menu yang Diizinkan:
                  </label>
                  {modalRole !== 'ADMIN' && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalHakAkses(ALL_PERMISSIONS.map((p) => p.key))}
                        className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalHakAkses(['DASHBOARD', 'INPUT_NASABAH', 'GADAI_BARU', 'PERPANJANG', 'PELUNASAN', 'BARANG_JAMINAN', 'CETAK_ULANG'])}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded"
                      >
                        Preset Kasir
                      </button>
                    </div>
                  )}
                </div>

                {modalRole === 'ADMIN' ? (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                    ★ Role **ADMIN** secara otomatis memiliki izin penuh untuk membuka seluruh menu dan fitur sistem.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = modalHakAkses.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          onClick={() => handleTogglePermission(perm.key)}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-xs'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-bold text-xs">{perm.label}</div>
                            <div className="text-[10px] text-gray-500">{perm.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {modalError && (
                <div className="p-2.5 bg-red-100 border border-red-200 text-red-800 rounded-xl font-semibold">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
