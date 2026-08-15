import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { TransaksiGadai, Pembayaran } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { formatRupiah, formatDateIndonesian } from '../utils/calculator';
import { Printer, Search, FileText, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';

interface CetakUlangNotaViewProps {
  onBackToDashboard: () => void;
}

export const CetakUlangNotaView: React.FC<CetakUlangNotaViewProps> = ({ onBackToDashboard }) => {
  const { transaksiList, pembayaranList, nasabahList, settings, deleteTransaksiGadai } = useSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransaksiGadai | null>(null);

  // Modal receipt trigger
  const [modalReceiptType, setModalReceiptType] = useState<'GADAI_BARU' | 'PERPANJANG' | 'PELUNASAN' | null>(null);
  const [selectedPembayaran, setSelectedPembayaran] = useState<Pembayaran | undefined>(undefined);

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredTxList = searchQuery.trim()
    ? transaksiList.filter(
        (t) =>
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.namaNasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.noHp.includes(searchQuery) ||
          t.imeiSn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transaksiList;

  const handleSelectTx = (tx: TransaksiGadai) => {
    setSelectedTx(tx);
  };

  const selectedNasabah = selectedTx
    ? nasabahList.find((n) => n.id === selectedTx.idNasabah)
    : undefined;

  // Payments related to this transaction
  const relatedPayments = selectedTx
    ? pembayaranList.filter((p) => p.idTransaksi === selectedTx.id)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <Printer className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Cetak Ulang Nota Transaksi</h2>
            <p className="text-xs text-blue-200">
              Pilih transaksi gadai untuk mencetak ulang Nota Gadai, Perpanjang, atau Pelunasan
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Search Bar */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase">
            Cari Data Gadai (Ketik No Nota, Nama Nasabah, No HP, IMEI/SN)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Contoh: GD-20260812-001 / Budi / iPhone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results List */}
        {!selectedTx ? (
          <div className="border border-gray-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
            {filteredTxList.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                Tidak ada data transaksi yang ditemukan.
              </div>
            ) : (
              filteredTxList.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => handleSelectTx(tx)}
                  className="p-3.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      {tx.id} - {tx.namaNasabah}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {tx.jenisBarang} {tx.brand} {tx.typeSeri} | Pinjaman: {formatRupiah(tx.pinjaman)}
                    </div>
                  </div>
                  <span className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded-lg shadow-xs">
                    Pilih Transaksi
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Transaction Detail Actions for Reprint */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-xl border border-blue-200 gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded">
                  TRANSAKSI DIPILIH #{selectedTx.id}
                </span>
                <div className="font-bold text-base text-slate-900 mt-1">{selectedTx.namaNasabah}</div>
                <div className="text-xs text-gray-600">
                  {selectedTx.jenisBarang} {selectedTx.brand} {selectedTx.typeSeri} | Tanggal: {formatDateIndonesian(selectedTx.tanggalGadai)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-700 font-bold bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg border border-red-300 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus / Batalkan
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-xs text-slate-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cari Lain
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Cetak Ulang Nota Gadai */}
              <div className="p-5 border-2 border-blue-200 rounded-2xl bg-blue-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-bold text-blue-900 text-sm">Cetak Ulang Nota Gadai</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Nota pendaftaran akad awal saat barang jaminan pertama kali digadaikan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPembayaran(undefined);
                    setModalReceiptType('GADAI_BARU');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak Nota Gadai
                </button>
              </div>

              {/* Option 2: Cetak Ulang Nota Perpanjang */}
              <div className="p-5 border-2 border-amber-200 rounded-2xl bg-amber-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-bold text-amber-900 text-sm">Cetak Ulang Nota Perpanjang</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Bukti perpanjangan waktu gadai +14 hari & pembayaran administrasi/denda.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const perp = relatedPayments.find((p) => p.jenisTransaksi === 'PERPANJANG');
                    setSelectedPembayaran(perp);
                    setModalReceiptType('PERPANJANG');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak Nota Perpanjang
                </button>
              </div>

              {/* Option 3: Cetak Ulang Nota Pelunasan */}
              <div className="p-5 border-2 border-emerald-200 rounded-2xl bg-emerald-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-bold text-emerald-900 text-sm">Cetak Ulang Nota Pelunasan</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Bukti pelunasan pokok pinjaman & pengembalian barang jaminan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const lunas = relatedPayments.find((p) => p.jenisTransaksi === 'PELUNASAN');
                    setSelectedPembayaran(lunas);
                    setModalReceiptType('PELUNASAN');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak Nota Pelunasan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hapus Transaksi Gadai #{selectedTx.id}</h3>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl space-y-2 text-xs text-slate-800">
              <p className="font-semibold">
                Apakah Anda yakin ingin membatalkan dan menghapus transaksi gadai ini?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-red-100 space-y-1 font-mono text-[11px]">
                <div><b>No Nota:</b> {selectedTx.id}</div>
                <div><b>Nasabah:</b> {selectedTx.namaNasabah} ({selectedTx.noHp})</div>
                <div><b>Barang:</b> {selectedTx.jenisBarang} - {selectedTx.brand} {selectedTx.typeSeri}</div>
                <div><b>Pinjaman:</b> {formatRupiah(selectedTx.pinjaman)}</div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Batal
              </button>

              <button
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError(null);
                  const res = await deleteTransaksiGadai(selectedTx.id);
                  setIsDeleting(false);
                  if (res.success) {
                    setShowDeleteConfirm(false);
                    setSelectedTx(null);
                  } else {
                    setDeleteError(res.error || 'Gagal menghapus transaksi.');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : <><Trash2 className="w-4 h-4" /> Ya, Hapus Transaksi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal Display */}
      {modalReceiptType && selectedTx && (
        <ReceiptModal
          type={modalReceiptType}
          transaksi={selectedTx}
          nasabah={selectedNasabah}
          pembayaran={selectedPembayaran}
          settings={settings}
          onClose={() => setModalReceiptType(null)}
        />
      )}
    </div>
  );
};
