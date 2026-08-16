import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { StatusGadai, TransaksiGadai } from '../types';
import { formatRupiah, formatDateIndonesian, evaluatePawnStatus } from '../utils/calculator';
import { ActiveTab } from '../components/Header';
import { PatternLock } from '../components/PatternLock';
import { Package, Search, Filter, Clock, CheckCircle, ShieldAlert, Eye, X, Trash2, AlertTriangle, Lock } from 'lucide-react';

interface BarangJaminanViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const BarangJaminanView: React.FC<BarangJaminanViewProps> = ({ setActiveTab }) => {
  const { transaksiList, nasabahList, deleteTransaksiGadai, hasPermission } = useSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusGadai | 'SEMUA'>('SEMUA');
  const [detailModalTx, setDetailModalTx] = useState<TransaksiGadai | null>(null);
  const [deleteModalTx, setDeleteModalTx] = useState<TransaksiGadai | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleExecuteDelete = async () => {
    if (!deleteModalTx) return;
    setIsDeleting(true);
    setDeleteStatusMessage(null);
    const res = await deleteTransaksiGadai(deleteModalTx.id);
    setIsDeleting(false);
    if (res.success) {
      setDeleteModalTx(null);
      if (detailModalTx?.id === deleteModalTx.id) {
        setDetailModalTx(null);
      }
    } else {
      setDeleteStatusMessage({ type: 'error', text: res.error || 'Gagal menghapus transaksi.' });
    }
  };

  const filteredList = transaksiList.filter((tx) => {
    const evalRes = evaluatePawnStatus(tx, today);
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.namaNasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.typeSeri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.imeiSn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'SEMUA' || evalRes.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <Package className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Daftar Barang Jaminan</h2>
            <p className="text-xs text-blue-200">
              Monitoring status barang jaminan: AKTIF, TENGGANG, HANGUS, TERLELANG, & LUNAS
            </p>
          </div>
        </div>

        <div className="bg-blue-800/80 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] text-blue-200 uppercase font-semibold">Total Item Jaminan</span>
          <div className="font-extrabold text-lg text-white">{transaksiList.length} Barang</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ID Nota, Nasabah, Brand, Seri, IMEI/SN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {(['SEMUA', 'AKTIF', 'TENGGANG', 'HANGUS', 'TERLELANG', 'LUNAS'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedStatus === st
                  ? 'bg-blue-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">ID Nota</th>
                <th className="p-3.5">Nama Nasabah</th>
                <th className="p-3.5">Detail Barang Jaminan</th>
                <th className="p-3.5">IMEI / SN</th>
                <th className="p-3.5">Pinjaman</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                    Tidak ada data barang jaminan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
                  const evalRes = evaluatePawnStatus(tx, today);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-blue-900 font-mono">{tx.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{tx.namaNasabah}</div>
                        <div className="text-[10px] text-gray-500">{tx.noHp}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-blue-950">
                          {tx.jenisBarang} - {tx.brand} {tx.typeSeri}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Warna: {tx.warna || '-'} | Perlengkapan: {Array.isArray(tx.perlengkapan) ? tx.perlengkapan.join(', ') : tx.perlengkapan}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-600">{tx.imeiSn || '-'}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatRupiah(tx.pinjaman)}</td>
                      <td className="p-3.5 font-medium">{formatDateIndonesian(tx.jatuhTempo)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-block ${
                            evalRes.status === 'AKTIF'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : evalRes.status === 'TENGGANG'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : evalRes.status === 'HANGUS'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : evalRes.status === 'TERLELANG'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {evalRes.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => setDetailModalTx(tx)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-1.5 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(evalRes.status === 'AKTIF' || evalRes.status === 'TENGGANG') && (
                          <>
                            <button
                              onClick={() => setActiveTab('PERPANJANG')}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Perpanjang
                            </button>
                            <button
                              onClick={() => setActiveTab('PELUNASAN')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Tebus
                            </button>
                          </>
                        )}
                        {hasPermission('HAPUS_TRANSAKSI') && (
                          <button
                            onClick={() => setDeleteModalTx(tx)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg transition"
                            title="Hapus / Batalkan Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Detail Modal */}
      {detailModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Detail Barang Jaminan #{detailModalTx.id}</h3>
              <button onClick={() => setDetailModalTx(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="font-bold text-blue-900 text-sm">{detailModalTx.namaNasabah}</div>
                <div className="text-gray-600">ID Nasabah: {detailModalTx.idNasabah} | No HP: {detailModalTx.noHp}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 border p-3 rounded-xl bg-slate-50">
                <div><b>Jenis:</b> {detailModalTx.jenisBarang}</div>
                <div><b>Brand:</b> {detailModalTx.brand}</div>
                <div><b>Seri:</b> {detailModalTx.typeSeri}</div>
                <div><b>IMEI/SN:</b> {detailModalTx.imeiSn || '-'}</div>
                <div><b>Warna:</b> {detailModalTx.warna || '-'}</div>
                <div><b>Perlengkapan:</b> {Array.isArray(detailModalTx.perlengkapan) ? detailModalTx.perlengkapan.join(', ') : detailModalTx.perlengkapan}</div>
              </div>

              {/* PIN & Pola Lock Section in Modal */}
              {(detailModalTx.pinHp || (detailModalTx.polaHp && detailModalTx.polaHp.length > 0)) && (
                <div className="border border-blue-200 bg-sky-50/50 p-3 rounded-xl space-y-2">
                  <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> Kunci Pengaman Perangkat:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {detailModalTx.pinHp && (
                      <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-xs">
                        <div className="text-[10px] text-gray-500 font-bold">PIN / PASSWORD HP:</div>
                        <div className="text-sm font-bold font-mono text-blue-950">{detailModalTx.pinHp}</div>
                      </div>
                    )}

                    {detailModalTx.polaHp && detailModalTx.polaHp.length > 0 && (
                      <div className="bg-white p-2 rounded-lg border border-blue-100 flex flex-col items-center">
                        <div className="text-[10px] text-gray-500 font-bold mb-1">POLA LAYAR (PATTERN):</div>
                        <PatternLock value={detailModalTx.polaHp} readOnly size={130} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Nominal Pinjaman:</span>
                  <b className="text-slate-900">{formatRupiah(detailModalTx.pinjaman)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin (7%):</span>
                  <b>{formatRupiah(detailModalTx.biayaAdmin)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal Gadai:</span>
                  <span>{formatDateIndonesian(detailModalTx.tanggalGadai)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600">
                  <span>Jatuh Tempo:</span>
                  <span>{formatDateIndonesian(detailModalTx.jatuhTempo)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t pt-3">
              <button
                onClick={() => {
                  const txToDelete = detailModalTx;
                  setDetailModalTx(null);
                  setDeleteModalTx(txToDelete);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> Batalkan / Hapus Transaksi
              </button>

              <button
                onClick={() => setDetailModalTx(null)}
                className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Pembatalan Transaksi</h3>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl space-y-2 text-xs text-slate-800">
              <p className="font-semibold">
                Apakah Anda yakin ingin membatalkan/menghapus transaksi gadai ini?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-red-100 space-y-1 font-mono text-[11px]">
                <div><b>No Nota:</b> {deleteModalTx.id}</div>
                <div><b>Nasabah:</b> {deleteModalTx.namaNasabah} ({deleteModalTx.noHp})</div>
                <div><b>Barang:</b> {deleteModalTx.jenisBarang} - {deleteModalTx.brand} {deleteModalTx.typeSeri}</div>
                <div><b>Pinjaman:</b> {formatRupiah(deleteModalTx.pinjaman)}</div>
              </div>
              <p className="text-[11px] text-red-700">
                ⚠️ Transaksi dan riwayat pembayarannya akan dihapus permanen dari sistem dan disinkronkan ke Google Sheet jika terhubung.
              </p>
            </div>

            {deleteStatusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  deleteStatusMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {deleteStatusMessage.text}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteModalTx(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Batal
              </button>

              <button
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ya, Hapus Transaksi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
