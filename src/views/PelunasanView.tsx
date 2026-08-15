import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useSync } from '../context/SyncContext';
import { TransaksiGadai, MetodePembayaran, Pembayaran } from '../types';
import { evaluatePawnStatus, formatRupiah, formatDateIndonesian } from '../utils/calculator';
import { ReceiptModal } from '../components/ReceiptModal';
import { CheckSquare, Search, CreditCard, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PelunasanViewProps {
  onBackToDashboard: () => void;
}

export const PelunasanView: React.FC<PelunasanViewProps> = ({ onBackToDashboard }) => {
  const { transaksiList, nasabahList, processPembayaran, settings } = useSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransaksiGadai | null>(null);

  // Payment method
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>('CASH');
  const [nominalCash, setNominalCash] = useState<string>('');
  const [nominalNonTunai, setNominalNonTunai] = useState<string>('');
  const [catatan, setCatatan] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPembayaran, setCompletedPembayaran] = useState<Pembayaran | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Active / Grace transactions available for redemption
  const eligibleTransactions = transaksiList.filter(
    (t) => t.status === 'AKTIF' || t.status === 'TENGGANG'
  );

  const filteredTx = searchQuery.trim()
    ? eligibleTransactions.filter(
        (t) =>
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.namaNasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.noHp.includes(searchQuery) ||
          t.imeiSn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : eligibleTransactions;

  const today = new Date().toISOString().split('T')[0];
  const evalData = selectedTx ? evaluatePawnStatus(selectedTx, today) : null;
  const totalWajibBayar = evalData ? evalData.totalPelunasan : 0;

  const handleProcessPelunasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !evalData) {
      alert('Pilih transaksi gadai terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);

    const pemId = `BYR-${Date.now().toString().slice(-6)}`;
    const newPembayaran: Pembayaran = {
      id: pemId,
      idTransaksi: selectedTx.id,
      idNasabah: selectedTx.idNasabah,
      namaNasabah: selectedTx.namaNasabah,
      jenisTransaksi: 'PELUNASAN',
      biayaAdmin: evalData.biayaAdmin,
      denda: evalData.denda,
      pelunasanPokok: selectedTx.pinjaman,
      totalDibayar: totalWajibBayar,
      metodePembayaran,
      rincianMetode:
        metodePembayaran === 'CASH+NON TUNAI'
          ? `Cash: ${nominalCash}, Non-Tunai: ${nominalNonTunai}`
          : metodePembayaran,
      tanggalPembayaran: today,
      petugas: 'Kasir Aulia 51',
      catatan,
    };

    const res = await processPembayaran(newPembayaran, 'LUNAS');
    setIsSubmitting(false);

    if (res.success) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setCompletedPembayaran(newPembayaran);
      setShowReceiptModal(true);
    } else {
      alert(res.error || 'Gagal memproses pelunasan gadai.');
    }
  };

  const selectedNasabah = selectedTx
    ? nasabahList.find((n) => n.id === selectedTx.idNasabah)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <CheckSquare className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pelunasan & Tebus Barang Jaminan</h2>
            <p className="text-xs text-emerald-100">
              Perhitungan Pokok Pinjaman + Admin 7% + Denda Keterlambatan
            </p>
          </div>
        </div>
        <button
          onClick={onBackToDashboard}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6">
        {/* Step 1: Cari Transaksi */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 1. Pencarian Transaksi Nasabah
          </h3>

          {selectedTx ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-200 px-2 py-0.5 rounded">
                  TRANSAKSI TERPILIH ({selectedTx.id})
                </span>
                <div className="font-bold text-base text-slate-900 mt-1">{selectedTx.namaNasabah}</div>
                <div className="text-xs text-gray-600">
                  {selectedTx.jenisBarang}: {selectedTx.brand} {selectedTx.typeSeri} | Pinjaman: {formatRupiah(selectedTx.pinjaman)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-xs text-red-600 font-bold hover:underline bg-white px-3 py-1 rounded border border-red-200"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ketik No Nota (GD-...), Nama Nasabah, IMEI/SN, atau No HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white shadow-inner">
                {filteredTx.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    Tidak ada transaksi gadai aktif atau tenggang yang dapat ditebus.
                  </div>
                ) : (
                  filteredTx.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTx(t)}
                      className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {t.id} - {t.namaNasabah}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {t.jenisBarang} {t.brand} {t.typeSeri} | Pokok: {formatRupiah(t.pinjaman)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          t.status === 'TENGGANG'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Rincian Pelunasan */}
        {selectedTx && evalData && (
          <form onSubmit={handleProcessPelunasan} className="space-y-6 pt-2">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Rincian Perhitungan Pelunasan Pokok + Admin
              </h3>

              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Pokok Pinjaman:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(selectedTx.pinjaman)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Biaya Administrasi (7%):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(evalData.biayaAdmin)}</span>
                </div>

                {evalData.status === 'TENGGANG' && (
                  <div className="flex justify-between text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                    <span>Denda Keterlambatan (Terlambat {evalData.hariKeterlambatan} Hari x 0,8%):</span>
                    <span className="font-bold">{formatRupiah(evalData.denda)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-emerald-950 border-t border-emerald-300 pt-2">
                  <span>TOTAL PELUNASAN / TEBUS:</span>
                  <span className="text-xl text-emerald-700">{formatRupiah(totalWajibBayar)}</span>
                </div>
              </div>
            </div>

            {/* Step 3: Metode Pembayaran */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 3. Metode Pembayaran Pelunasan
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CASH', 'TRANSFER', 'QRIS', 'E-WALLET', 'CASH+NON TUNAI'] as MetodePembayaran[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodePembayaran(m)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-1.5 ${
                      metodePembayaran === m
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-gray-300 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {m}
                  </button>
                ))}
              </div>

              {metodePembayaran === 'CASH+NON TUNAI' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-gray-200 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Nominal Cash (Rp)</label>
                    <input
                      type="text"
                      placeholder="Rp 500.000"
                      value={nominalCash}
                      onChange={(e) => setNominalCash(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Nominal Non-Tunai (Rp)</label>
                    <input
                      type="text"
                      placeholder="Rp 500.000"
                      value={nominalNonTunai}
                      onChange={(e) => setNominalNonTunai(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses Pelunasan...
                  </>
                ) : (
                  <>
                    PROSES PELUNASAN & CETAK NOTA <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && completedPembayaran && selectedTx && (
        <ReceiptModal
          type="PELUNASAN"
          transaksi={selectedTx}
          nasabah={selectedNasabah}
          pembayaran={completedPembayaran}
          settings={settings}
          onClose={() => {
            setShowReceiptModal(false);
            onBackToDashboard();
          }}
        />
      )}
    </div>
  );
};
