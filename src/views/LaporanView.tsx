import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { formatRupiah, formatDateIndonesian } from '../utils/calculator';
import { BarChart3, Calendar, Download, Printer, TrendingUp, DollarSign, Wallet, FileSpreadsheet } from 'lucide-react';

export const LaporanView: React.FC = () => {
  const { transaksiList, pembayaranList } = useSync();

  const [periode, setPeriode] = useState<'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'TAHUNAN'>('BULANAN');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Helper date filters
  const filterByPeriode = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    if (periode === 'HARIAN') {
      return dateStr === todayStr;
    } else if (periode === 'MINGGUAN') {
      const diffTime = Math.abs(today.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } else if (periode === 'BULANAN') {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    } else if (periode === 'TAHUNAN') {
      return d.getFullYear() === today.getFullYear();
    }
    return true;
  };

  const filteredTx = transaksiList.filter((t) => filterByPeriode(t.tanggalGadai));
  const filteredPem = pembayaranList.filter((p) => filterByPeriode(p.tanggalPembayaran));

  // Calculated Metrics
  const totalPinjamanDisalurkan = filteredTx.reduce((sum, t) => sum + t.pinjaman, 0);
  const totalEstimasiAdmin7 = filteredTx.reduce((sum, t) => sum + t.biayaAdmin, 0);

  const totalAdminReceived = filteredPem.reduce((sum, p) => sum + p.biayaAdmin, 0);
  const totalDendaReceived = filteredPem.reduce((sum, p) => sum + p.denda, 0);
  const totalPokokPelunasan = filteredPem.reduce((sum, p) => sum + p.pelunasanPokok, 0);
  const totalKasMasuk = filteredPem.reduce((sum, p) => sum + p.totalDibayar, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Laporan & Analisis Keuangan</h2>
            <p className="text-xs text-indigo-200">
              Rekapitulasi transaksi pinjaman, biaya administrasi, denda, & kas masuk Aulia 51 Gadai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-white text-indigo-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow hover:bg-indigo-50 transition"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Periode Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" /> Filter Periode Laporan:
        </div>

        <div className="flex space-x-2">
          {(['HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                periode === p
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Pinjaman Disalurkan</div>
          <div className="text-xl font-black text-blue-900 mt-2">{formatRupiah(totalPinjamanDisalurkan)}</div>
          <div className="text-[11px] text-gray-400 mt-1">{filteredTx.length} Transaksi Baru</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Total Kas Masuk Diterima</div>
          <div className="text-xl font-black text-emerald-700 mt-2">{formatRupiah(totalKasMasuk)}</div>
          <div className="text-[11px] text-emerald-600 mt-1">{filteredPem.length} Pembayaran</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Profit Admin (7%) Diterima</div>
          <div className="text-xl font-black text-indigo-700 mt-2">{formatRupiah(totalAdminReceived)}</div>
          <div className="text-[11px] text-gray-400 mt-1">Pendapatan Bersih Admin</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Total Denda Diterima</div>
          <div className="text-xl font-black text-amber-700 mt-2">{formatRupiah(totalDendaReceived)}</div>
          <div className="text-[11px] text-amber-600 mt-1">Denda Keterlambatan 0.8%/Hari</div>
        </div>
      </div>

      {/* Detail Pembayaran Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b pb-2">
          Rincian Transaksi Pembayaran ({periode})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">ID Bayar</th>
                <th className="p-3">ID Nota</th>
                <th className="p-3">Nama Nasabah</th>
                <th className="p-3">Jenis</th>
                <th className="p-3">Admin (7%)</th>
                <th className="p-3">Denda</th>
                <th className="p-3">Pelunasan Pokok</th>
                <th className="p-3">Total Bayar</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {filteredPem.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-400 text-xs">
                    Belum ada riwayat pembayaran pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredPem.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-blue-900">{p.id}</td>
                    <td className="p-3 font-mono">{p.idTransaksi}</td>
                    <td className="p-3 font-bold">{p.namaNasabah}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.jenisTransaksi === 'PERPANJANG'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.jenisTransaksi}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{formatRupiah(p.biayaAdmin)}</td>
                    <td className="p-3 text-rose-700 font-semibold">{formatRupiah(p.denda)}</td>
                    <td className="p-3">{formatRupiah(p.pelunasanPokok)}</td>
                    <td className="p-3 font-bold text-emerald-800">{formatRupiah(p.totalDibayar)}</td>
                    <td className="p-3 font-bold">{p.metodePembayaran}</td>
                    <td className="p-3 text-gray-500">{formatDateIndonesian(p.tanggalPembayaran)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
