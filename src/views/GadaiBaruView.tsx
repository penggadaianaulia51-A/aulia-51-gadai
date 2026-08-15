import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useSync } from '../context/SyncContext';
import { BRAND_PER_JENIS } from '../data/brandList';
import { DAFTAR_WARNA } from '../data/indonesiaProvinces';
import { JenisBarang, TransaksiGadai, Perlengkapan, Nasabah } from '../types';
import { calculateNewPawn, formatRupiah, formatDateIndonesian } from '../utils/calculator';
import { ReceiptModal } from '../components/ReceiptModal';
import { PatternLock } from '../components/PatternLock';
import { PlusCircle, Search, Calculator, CheckSquare, Loader2, ArrowLeft, Lock } from 'lucide-react';

interface GadaiBaruViewProps {
  preSelectedNasabahId?: string;
  onBackToDashboard: () => void;
}

export const GadaiBaruView: React.FC<GadaiBaruViewProps> = ({ preSelectedNasabahId, onBackToDashboard }) => {
  const { nasabahList, transaksiList, addTransaksiGadai, settings } = useSync();

  // Search & Selected Nasabah
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);

  useEffect(() => {
    if (preSelectedNasabahId) {
      const found = nasabahList.find((n) => n.id === preSelectedNasabahId);
      if (found) setSelectedNasabah(found);
    }
  }, [preSelectedNasabahId, nasabahList]);

  // Form Item Fields
  const [jenisBarang, setJenisBarang] = useState<JenisBarang>('HP');
  const [brand, setBrand] = useState('Apple (iPhone)');
  const [brandManual, setBrandManual] = useState('');
  const [typeSeri, setTypeSeri] = useState('');
  const [imeiSn, setImeiSn] = useState('');
  const [warna, setWarna] = useState('Hitam (Black)');
  const [warnaManual, setWarnaManual] = useState('');
  const [pinHp, setPinHp] = useState('');
  const [polaHp, setPolaHp] = useState<number[]>([]);

  // Perlengkapan Checkboxes
  const perlengkapanOptions: Perlengkapan[] = ['FULLSET', 'ADAPTOR', 'KABEL', 'KARDUS', 'TAS/CASE', 'TIDAK ADA'];
  const [selectedPerlengkapan, setSelectedPerlengkapan] = useState<Perlengkapan[]>(['ADAPTOR']);

  // Financial & Date Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggalGadaiInput, setTanggalGadaiInput] = useState<string>(todayStr);
  const [isManualTanggal, setIsManualTanggal] = useState<boolean>(false);

  const [pinjamanInput, setPinjamanInput] = useState<string>('1000000');
  const pinjamanNum = parseFloat(pinjamanInput.replace(/[^0-9]/g, '')) || 0;

  // Calculation Results
  const calc = calculateNewPawn(pinjamanNum, isManualTanggal ? tanggalGadaiInput : todayStr);

  // Submission State & Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTx, setCompletedTx] = useState<TransaksiGadai | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filtered Nasabah Search Results
  const filteredNasabah = searchQuery.trim()
    ? nasabahList.filter(
        (n) =>
          n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.noHp.includes(searchQuery)
      )
    : [];

  const handleTogglePerlengkapan = (item: Perlengkapan) => {
    if (item === 'TIDAK ADA') {
      setSelectedPerlengkapan(['TIDAK ADA']);
      return;
    }
    const filtered = selectedPerlengkapan.filter((i) => i !== 'TIDAK ADA');
    if (filtered.includes(item)) {
      setSelectedPerlengkapan(filtered.filter((i) => i !== item));
    } else {
      setSelectedPerlengkapan([...filtered, item]);
    }
  };

  const handleProcessGadai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNasabah) {
      alert('Pilih Nasabah terlebih dahulu!');
      return;
    }
    if (!typeSeri || pinjamanNum <= 0) {
      alert('Mohon isi Type/Seri dan Nominal Pinjaman dengan benar!');
      return;
    }

    setIsSubmitting(true);

    const finalBrand = brand === 'Lainnya (Isi Manual)' ? brandManual : brand;
    const finalWarna = warna === 'Lainnya' ? warnaManual : warna;

    // Generate Transaction ID (e.g. GD-20260812-001)
    const dateFormattedForId = calc.tanggalGadai.replace(/-/g, '');
    const txId = `GD-${dateFormattedForId}-${String(transaksiList.length + 1).padStart(3, '0')}`;

    const newTx: TransaksiGadai = {
      id: txId,
      idNasabah: selectedNasabah.id,
      namaNasabah: selectedNasabah.nama,
      noHp: selectedNasabah.noHp,
      jenisBarang,
      brand: finalBrand,
      typeSeri,
      imeiSn,
      warna: finalWarna,
      perlengkapan: selectedPerlengkapan,
      pinHp: pinHp.trim() || undefined,
      polaHp: polaHp.length > 0 ? polaHp : undefined,
      pinjaman: pinjamanNum,
      biayaAdmin: calc.biayaAdmin,
      tanggalGadai: calc.tanggalGadai,
      jatuhTempo: calc.jatuhTempo,
      masaTenggangHingga: calc.masaTenggangHingga,
      status: 'AKTIF',
      denda: 0,
      petugas: 'Aulia 51 Kasir',
    };

    const res = await addTransaksiGadai(newTx);
    setIsSubmitting(false);

    if (res.success) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setCompletedTx(newTx);
      setShowReceiptModal(true);
    } else {
      alert(res.error || 'Gagal memproses transaksi gadai baru.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Title Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <PlusCircle className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pendaftaran Gadai Baru</h2>
            <p className="text-xs text-blue-200">
              Pengisian detail barang jaminan & perhitungan pinjaman
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

      <form onSubmit={handleProcessGadai} className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6">
        {/* Section 1: Cari & Pilih Nasabah */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> 1. Pilih Data Nasabah
          </h3>

          {selectedNasabah ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-200 px-2 py-0.5 rounded">
                  NASABAH TERPILIH ({selectedNasabah.id})
                </span>
                <div className="font-bold text-base text-slate-900 mt-1">{selectedNasabah.nama}</div>
                <div className="text-xs text-gray-600">
                  {selectedNasabah.jenisIdentitas}: {selectedNasabah.nomorIdentitas} | No HP: {selectedNasabah.noHp}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNasabah(null)}
                className="text-xs text-red-600 font-bold hover:underline bg-white px-3 py-1 rounded border border-red-200"
              >
                Ganti Nasabah
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ketik Nama, ID Nasabah, atau No HP untuk mencari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {filteredNasabah.length > 0 && (
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white shadow-lg">
                  {filteredNasabah.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNasabah(n);
                        setSearchQuery('');
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{n.nama}</div>
                        <div className="text-[11px] text-gray-500">
                          {n.id} - {n.noHp} - {n.kabupaten}
                        </div>
                      </div>
                      <span className="text-xs bg-blue-600 text-white font-bold px-2 py-1 rounded">
                        Pilih
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Detail Barang Jaminan */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> 2. Detail Barang Jaminan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Barang</label>
              <select
                value={jenisBarang}
                onChange={(e) => {
                  const jb = e.target.value as JenisBarang;
                  setJenisBarang(jb);
                  const defaultBrand = BRAND_PER_JENIS[jb]?.[0] || 'Lainnya (Isi Manual)';
                  setBrand(defaultBrand);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
              >
                <option value="HP">HP / Smartphone</option>
                <option value="LAPTOP">Laptop / Notebook</option>
                <option value="KAMERA">Kamera & Aksesoris</option>
                <option value="TABLET">Tablet / iPad</option>
                <option value="TV / ELEKTRONIK">TV & Elektronik</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand / Merk</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {(BRAND_PER_JENIS[jenisBarang] || BRAND_PER_JENIS['LAINNYA']).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {brand === 'Lainnya (Isi Manual)' && (
                <input
                  type="text"
                  placeholder="Isi Merk Manual..."
                  value={brandManual}
                  onChange={(e) => setBrandManual(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg mt-1"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Type / Seri <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: iPhone 13 Pro / Legion 5"
                value={typeSeri}
                onChange={(e) => setTypeSeri(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">IMEI / Serial Number</label>
              <input
                type="text"
                placeholder="358xxxxxxxxx / SN..."
                value={imeiSn}
                onChange={(e) => setImeiSn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Warna Barang</label>
              <select
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {DAFTAR_WARNA.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              {warna === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Warna manual..."
                  value={warnaManual}
                  onChange={(e) => setWarnaManual(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg mt-1"
                />
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-2">Perlengkapan</label>
              <div className="flex flex-wrap gap-2">
                {perlengkapanOptions.map((opt) => {
                  const isChecked = selectedPerlengkapan.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleTogglePerlengkapan(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN / Passcode & Pattern Lock HP / Perangkat */}
            <div className="md:col-span-3 pt-3 border-t border-gray-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" /> Kunci Pengaman Perangkat (PIN & Pola Layar)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    PIN / Password Kunci Layar (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 123456 / Budi123 / Kunci: 0000"
                    value={pinHp}
                    onChange={(e) => setPinHp(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 bg-white font-bold text-blue-900"
                  />
                  <p className="text-[10px] text-gray-500">
                    * Catat PIN/Password atau kata sandi pembuka kunci layar perangkat jika ada.
                  </p>
                </div>

                <div className="space-y-1 flex flex-col items-center">
                  <label className="block text-xs font-bold text-gray-700 self-start">
                    Gambar Pola Kunci Layar (Pattern Lock 3x3)
                  </label>
                  <PatternLock value={polaHp} onChange={setPolaHp} size={170} />
                  <p className="text-[10px] text-gray-500 text-center">
                    * Hubungkan titik 3x3 menggunakan mouse atau layar sentuh untuk menggambar pola.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Nominal Pinjaman & Hitung Otomatis */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> 3. Nominal Pinjaman & Ketentuan Akad
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nominal Pinjaman (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pinjamanInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPinjamanInput(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-4 py-3 text-lg font-black text-blue-900 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  * Pinjaman dicairkan FULL tanpa potongan biaya di depan.
                </p>
              </div>

              {/* Tanggal Gadai Selection Option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isManualTanggal}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsManualTanggal(checked);
                        if (!checked) {
                          setTanggalGadaiInput(todayStr);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Ubah Tanggal Transaksi secara Manual (Custom Date)
                    </span>
                  </label>
                  {!isManualTanggal && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Otomatis Hari Ini
                    </span>
                  )}
                </div>

                {isManualTanggal && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      Pilih Tanggal Akad Gadai Baru:
                    </label>
                    <input
                      type="date"
                      value={tanggalGadaiInput}
                      onChange={(e) => setTanggalGadaiInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-blue-400 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      * Jatuh Tempo (+14 Hari) & Masa Tenggang (+28 Hari) akan otomatis dihitung berdasarkan tanggal ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-blue-900 border-b border-blue-200 pb-1 uppercase flex items-center justify-between">
                <span>Rincian Perhitungan Akad</span>
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terima Bersih:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(calc.penerimaanBersih)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Administrasi (7%):</span>
                <span className="font-bold text-slate-900">{formatRupiah(calc.biayaAdmin)} (Dibayar di Belakang)</span>
              </div>
              <div className="flex justify-between font-bold text-blue-950">
                <span>Tanggal Gadai:</span>
                <span>{formatDateIndonesian(calc.tanggalGadai)} {isManualTanggal && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">(Custom)</span>}</span>
              </div>
              <div className="flex justify-between text-red-700 font-bold border-t border-blue-200 pt-1">
                <span>Jatuh Tempo (14 Hari):</span>
                <span>{formatDateIndonesian(calc.jatuhTempo)}</span>
              </div>
              <div className="flex justify-between text-rose-800 text-[11px] font-semibold">
                <span>Batas Masa Tenggang (+28 Hari):</span>
                <span>{formatDateIndonesian(calc.masaTenggangHingga)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedNasabah}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses Transaksi...
              </>
            ) : (
              <>
                PROSES & CETAK NOTA GADAI <CheckSquare className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Receipt Modal (108mm x 165mm) */}
      {showReceiptModal && completedTx && (
        <ReceiptModal
          type="GADAI_BARU"
          transaksi={completedTx}
          nasabah={selectedNasabah || undefined}
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
