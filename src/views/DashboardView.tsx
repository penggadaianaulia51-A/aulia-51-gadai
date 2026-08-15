import React from 'react';
import { useSync } from '../context/SyncContext';
import { ActiveTab } from '../components/Header';
import { formatRupiah, formatDateIndonesian } from '../utils/calculator';
import {
  UserPlus,
  PlusCircle,
  Clock,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Package,
  ArrowRight,
  ShieldAlert,
  Wallet,
  CalendarDays
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectNasabahForGadai?: (nasabahId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { transaksiList, nasabahList, syncState } = useSync();

  const isConnected = syncState.isConnected;

  // Calculate Summary Statistics
  const totalNasabah = nasabahList.length;
  const activePawns = transaksiList.filter((t) => t.status === 'AKTIF');
  const gracePawns = transaksiList.filter((t) => t.status === 'TENGGANG');
  const expiredPawns = transaksiList.filter((t) => t.status === 'HANGUS');
  const auctionedPawns = transaksiList.filter((t) => t.status === 'TERLELANG');
  const paidPawns = transaksiList.filter((t) => t.status === 'LUNAS');

  const totalPinjamanAktif = activePawns.reduce((sum, t) => sum + t.pinjaman, 0);
  const totalEstimasiAdmin = activePawns.reduce((sum, t) => sum + t.biayaAdmin, 0);

  // Today's Date
  const today = new Date().toISOString().split('T')[0];

  // Urgent Alerts: Pawns maturing today or past due (tenggang)
  const urgentAlerts = transaksiList.filter(
    (t) => (t.status === 'AKTIF' && t.jatuhTempo <= today) || t.status === 'TENGGANG'
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div
        className={`p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
          isConnected
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/50'
            : 'bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 border border-red-700/50'
        }`}
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            AULIA 51 GADAI MANAGEMENT SYSTEM
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
            Selamat Datang di Sistem Penggadaian
          </h2>
          <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
            Sistem penggadaian pintar dengan perhitungan Administrasi 7% per 14 Hari, Masa Tenggang 14 Hari, Denda 0,8%/hari, dan nota standar 108mm x 165mm.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('INPUT_NASABAH')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs md:text-sm flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" /> Nasabah Baru
          </button>
          <button
            onClick={() => setActiveTab('GADAI_BARU')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs md:text-sm flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" /> Gadai Baru
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Pawns */}
        <div
          onClick={() => setActiveTab('BARANG_JAMINAN')}
          className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gadai Aktif</span>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-3">{activePawns.length} <span className="text-xs font-normal text-gray-500">Unit</span></div>
          <p className="text-xs text-blue-700 font-semibold mt-1">{formatRupiah(totalPinjamanAktif)} Total Pinjaman</p>
        </div>

        {/* Grace Period (Tenggang) */}
        <div
          onClick={() => setActiveTab('BARANG_JAMINAN')}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Masa Tenggang</span>
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-3">{gracePawns.length} <span className="text-xs font-normal text-amber-600">Unit</span></div>
          <p className="text-xs text-amber-700 font-medium mt-1">Denda Keterlambatan 0.8%/Hari</p>
        </div>

        {/* Expired / Leilang Pawns */}
        <div
          onClick={() => setActiveTab('BARANG_JAMINAN')}
          className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Hangus / Lelang</span>
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-800 mt-3">
            {expiredPawns.length + auctionedPawns.length} <span className="text-xs font-normal text-rose-600">Unit</span>
          </div>
          <p className="text-xs text-rose-600 font-medium mt-1">Siap Masuk Daftar Lelang</p>
        </div>

        {/* Total Nasabah */}
        <div
          onClick={() => setActiveTab('INPUT_NASABAH')}
          className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Nasabah</span>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-3">{totalNasabah} <span className="text-xs font-normal text-gray-500">Orang</span></div>
          <p className="text-xs text-indigo-600 font-medium mt-1">Terdaftar di Google Sheet</p>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('PERPANJANG')}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-lg mt-4">Perpanjang Gadai</h3>
          <p className="text-xs text-amber-100 mt-1">
            Bayar Administrasi 7% untuk menambah masa berlaku gadai +14 hari.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('PELUNASAN')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-lg mt-4">Pelunasan / Tebus</h3>
          <p className="text-xs text-emerald-100 mt-1">
            Hitung total pelunasan pokok + admin + denda dan cetak nota pelunasan.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('LAPORAN')}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-lg mt-4">Laporan Keuangan</h3>
          <p className="text-xs text-indigo-100 mt-1">
            Laporan harian, mingguan, bulanan, dan tahunan omset & admin.
          </p>
        </div>
      </div>

      {/* Expiration & Urgent Notification List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Peringatan Jatuh Tempo & Masa Tenggang
            </h3>
          </div>
          <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            {urgentAlerts.length} Perlu Perhatian
          </span>
        </div>

        {urgentAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            ✅ Tidak ada gadai yang jatuh tempo atau dalam masa tenggang hari ini. Semua transaksi lancar!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Nama Nasabah</th>
                  <th className="p-3">Barang Jaminan</th>
                  <th className="p-3">Pinjaman</th>
                  <th className="p-3">Jatuh Tempo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {urgentAlerts.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-blue-900">{tx.id}</td>
                    <td className="p-3 font-semibold">{tx.namaNasabah}</td>
                    <td className="p-3">
                      {tx.jenisBarang} - {tx.brand} {tx.typeSeri}
                    </td>
                    <td className="p-3 font-bold">{formatRupiah(tx.pinjaman)}</td>
                    <td className="p-3 font-medium text-amber-800">
                      {formatDateIndonesian(tx.jatuhTempo)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          tx.status === 'TENGGANG'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setActiveTab('PERPANJANG')}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                      >
                        Perpanjang
                      </button>
                      <button
                        onClick={() => setActiveTab('PELUNASAN')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                      >
                        Pelunasan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
