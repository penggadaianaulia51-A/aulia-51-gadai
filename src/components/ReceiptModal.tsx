import React from 'react';
import { TransaksiGadai, Nasabah, Pembayaran, AppSettings } from '../types';
import { formatRupiah, formatDateIndonesian, addDays } from '../utils/calculator';
import { PatternLock } from './PatternLock';
import { Printer, Send, Mail, CheckCircle, X } from 'lucide-react';

interface ReceiptModalProps {
  type: 'GADAI_BARU' | 'PERPANJANG' | 'PELUNASAN';
  transaksi: TransaksiGadai;
  nasabah?: Nasabah;
  pembayaran?: Pembayaran;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  type,
  transaksi,
  nasabah,
  pembayaran,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const rawHp = nasabah?.noHp || transaksi.noHp || '';
    let cleanHp = rawHp.replace(/[^0-9]/g, '');
    if (cleanHp.startsWith('0')) cleanHp = '62' + cleanHp.slice(1);

    const titleText =
      type === 'GADAI_BARU'
        ? 'NOTA PENDAFTARAN GADAI BARU'
        : type === 'PERPANJANG'
        ? 'NOTA PERPANJANGAN GADAI'
        : 'NOTA PELUNASAN GADAI';

    const message = `*${settings.namaToko}*\n` +
      `-------------------------------------\n` +
      `*${titleText}*\n` +
      `No Nota: *${transaksi.id}*\n` +
      `Nama Nasabah: *${nasabah?.nama || transaksi.namaNasabah}*\n` +
      `Barang: *${transaksi.jenisBarang} - ${transaksi.brand} ${transaksi.typeSeri}*\n` +
      `IMEI/SN: *${transaksi.imeiSn || '-'}*\n` +
      `PIN/Passcode HP: *${transaksi.pinHp || '-'}*\n` +
      `Pinjaman: *${formatRupiah(transaksi.pinjaman)}*\n` +
      `Biaya Admin (7%): *${formatRupiah(transaksi.biayaAdmin)}*\n` +
      `-------------------------------------\n` +
      `TANGGAL MASUK: *${formatDateIndonesian(transaksi.tanggalGadai)}*\n` +
      `BATAS WAKTU (14 HARI): *${formatDateIndonesian(transaksi.jatuhTempo)}*\n` +
      `MASA TENGGANG (+14 HARI): *${formatDateIndonesian(transaksi.masaTenggangHingga)}*\n` +
      `TANGGAL HANGUS: *${formatDateIndonesian(addDays(transaksi.masaTenggangHingga, 1)).toUpperCase()}*\n` +
      (pembayaran ? `Total Dibayar: *${formatRupiah(pembayaran.totalDibayar)}* (${pembayaran.metodePembayaran})\n` : '') +
      `-------------------------------------\n` +
      `Terima kasih telah menggunakan layanan ${settings.namaToko}.\n` +
      `Info/WhatsApp: ${settings.noHpToko}`;

    const waUrl = `https://wa.me/${cleanHp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleSendEmail = () => {
    const emailTo = nasabah?.email || '';
    const subject = `[${settings.namaToko}] Nota Transaksi #${transaksi.id}`;
    const body = `Yth. ${nasabah?.nama || transaksi.namaNasabah},\n\nTerima kasih atas transaksi Anda di AULIA 51 GADAI.\nDetail Nota #${transaksi.id}:\nBarang: ${transaksi.brand} ${transaksi.typeSeri}\nPinjaman: ${formatRupiah(transaksi.pinjaman)}\nTanggal Masuk: ${formatDateIndonesian(transaksi.tanggalGadai)}\nBatas Waktu: ${formatDateIndonesian(transaksi.jatuhTempo)}\nTanggal Hangus: ${formatDateIndonesian(addDays(transaksi.jatuhTempo, 1))}\n\nSalam,\nAulia 51 Gadai`;

    window.open(`mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 md:p-6 my-auto print:p-0 print:shadow-none print:max-w-none print:w-auto">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-800 text-base md:text-lg">
              Desain Nota Standar Hitam-Putih (108mm x 165mm)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- RECEIPT CONTAINER STRICTLY SIZED FOR 108mm * 165mm (100% PURE BLACK AND WHITE) --- */}
        <div className="overflow-x-auto flex justify-center bg-gray-100 p-2 sm:p-4 rounded-xl print:bg-white print:p-0">
          <div
            id="printable-receipt"
            className="bg-white text-black border-2 border-black shadow-md font-sans p-4 relative flex flex-col justify-between"
            style={{
              width: '108mm',
              minHeight: '165mm',
              boxSizing: 'border-box',
              fontSize: '11px',
              lineHeight: '1.3',
              color: '#000000',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header Store Info */}
            <div className="text-center border-b-2 border-black pb-1 mb-1.5">
              <div className="font-black text-lg text-black tracking-wider uppercase">
                {settings.namaToko}
              </div>
              <div className="text-[9.5px] text-black font-medium mt-0.5">
                {settings.alamatToko}
              </div>
              <div className="text-[9px] text-black font-mono">
                HP/WA: {settings.noHpToko} | Email: {settings.emailToko}
              </div>
            </div>

            {/* Receipt Title Box */}
            <div className="text-center border-2 border-black bg-white text-black font-black text-xs py-1 px-2 uppercase mb-2 tracking-wider">
              {type === 'GADAI_BARU'
                ? 'NOTA PENDAFTARAN GADAI BARU'
                : type === 'PERPANJANG'
                ? 'NOTA PERPANJANGAN GADAI'
                : 'NOTA PELUNASAN GADAI'}
            </div>

            {/* Transaction Metadata (WITHOUT STATUS) */}
            <div className="grid grid-cols-2 gap-x-2 text-[10px] bg-white p-1.5 border border-black mb-2 text-black">
              <div>
                <span className="text-black font-bold">NO NOTA:</span>{' '}
                <b className="text-black font-mono font-bold">{transaksi.id}</b>
              </div>
              <div className="text-right">
                <span className="text-black font-bold">TANGGAL MASUK:</span>{' '}
                <b className="text-black font-bold">{formatDateIndonesian(transaksi.tanggalGadai)}</b>
              </div>
              <div className="col-span-2 mt-1 pt-1 border-t border-black flex justify-between">
                <div>
                  <span className="text-black font-bold">PETUGAS:</span>{' '}
                  <span className="text-black font-bold">{pembayaran?.petugas || transaksi.petugas || 'Kasir'}</span>
                </div>
                {pembayaran && (
                  <div>
                    <span className="text-black font-bold">TGL BAYAR:</span>{' '}
                    <span className="text-black font-bold">{formatDateIndonesian(pembayaran.tanggalPembayaran)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Data Nasabah */}
            <div className="border border-black p-2 mb-2 bg-white">
              <div className="font-black text-[10px] text-black uppercase tracking-wider mb-1 border-b border-black pb-0.5">
                DATA NASABAH
              </div>
              <table className="w-full text-[10px] text-black border-collapse">
                <tbody>
                  <tr>
                    <td className="w-28 text-black font-bold">ID Nasabah</td>
                    <td className="w-2 text-center text-black font-bold">:</td>
                    <td className="font-mono text-black font-bold">{transaksi.idNasabah}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">Nama Lengkap</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="font-black text-black uppercase">{nasabah?.nama || transaksi.namaNasabah}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">No Identitas</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="text-black font-mono">{nasabah ? `${nasabah.jenisIdentitas}: ${nasabah.nomorIdentitas}` : '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">No HP / WhatsApp</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="text-black font-mono font-bold">{nasabah?.noHp || transaksi.noHp}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">Alamat</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="text-black">
                      {nasabah
                        ? `${nasabah.dusun}, Desa ${nasabah.desa}, Kec. ${nasabah.kecamatan}`
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Keterangan Barang Jaminan */}
            <div className="border border-black p-2 mb-2 bg-white">
              <div className="font-black text-[10px] text-black uppercase tracking-wider mb-1 border-b border-black pb-0.5">
                KETERANGAN BARANG JAMINAN
              </div>
              <table className="w-full text-[10px] text-black border-collapse">
                <tbody>
                  <tr>
                    <td className="w-28 text-black font-bold">Jenis Barang</td>
                    <td className="w-2 text-center text-black font-bold">:</td>
                    <td className="font-black text-black uppercase">{transaksi.jenisBarang}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">Brand / Type</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="font-bold text-black">{transaksi.brand} - {transaksi.typeSeri}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">IMEI / SN</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="font-mono text-black font-bold">{transaksi.imeiSn || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">Warna</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="text-black">{transaksi.warna || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold">Perlengkapan</td>
                    <td className="text-center text-black font-bold">:</td>
                    <td className="text-black">
                      {Array.isArray(transaksi.perlengkapan)
                        ? transaksi.perlengkapan.join(', ')
                        : transaksi.perlengkapan}
                    </td>
                  </tr>
                  <tr className="border-t border-black">
                    <td className="text-black font-bold pt-1">PIN / PASSCODE HP</td>
                    <td className="text-center text-black font-bold pt-1">:</td>
                    <td className="font-black font-mono text-black text-[11px] pt-1">{transaksi.pinHp || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-black font-bold align-top pt-1">POLA LAYAR (PATTERN)</td>
                    <td className="text-center text-black font-bold align-top pt-1">:</td>
                    <td className="text-black pt-1">
                      {transaksi.polaHp && transaksi.polaHp.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <b className="font-mono text-[9px] text-black border border-black px-1.5 py-0.5">
                            [{transaksi.polaHp.map((d) => d + 1).join(' ➔ ')}]
                          </b>
                          <PatternLock value={transaksi.polaHp} readOnly monochrome size={50} />
                        </div>
                      ) : (
                        <span className="text-black font-mono">-</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Rincian Keuangan & Tanggal Penting */}
            <div className="border-2 border-black p-2 mb-2 bg-white text-black">
              <div className="font-black text-[10px] text-black uppercase tracking-wider mb-1 border-b border-black pb-0.5">
                RINCIAN KEUANGAN & TANGGAL PENTING
              </div>

              <div className="flex justify-between text-[11px] font-bold my-0.5">
                <span>Nominal Pinjaman:</span>
                <span className="font-black text-black text-xs">{formatRupiah(transaksi.pinjaman)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-black my-0.5">
                <span>Biaya Admin (7% / 14 Hari):</span>
                <span>{formatRupiah(transaksi.biayaAdmin)}</span>
              </div>

              <div className="border-t border-black my-1 pt-1 space-y-1">
                <div className="flex justify-between text-[10px] text-black font-black border-2 border-black p-1 bg-white">
                  <span>TANGGAL HANGUS:</span>
                  <span className="font-mono underline font-bold text-xs">{formatDateIndonesian(addDays(transaksi.masaTenggangHingga, 1)).toUpperCase()}</span>
                </div>

                <div className="flex justify-between text-[10px] text-black font-bold p-0.5">
                  <span>Jatuh Tempo (14 Hari):</span>
                  <span>{formatDateIndonesian(transaksi.jatuhTempo)}</span>
                </div>

                <div className="flex justify-between text-[9px] text-black font-semibold p-0.5">
                  <span>Batas Masa Tenggang (+14 Hari):</span>
                  <span>{formatDateIndonesian(transaksi.masaTenggangHingga)}</span>
                </div>
              </div>

              {pembayaran && (
                <div className="mt-1.5 pt-1.5 border-t-2 border-black text-[10px]">
                  <div className="flex justify-between text-black font-black">
                    <span>DIBAYAR SAAT INI ({pembayaran.jenisTransaksi}):</span>
                    <span>{formatRupiah(pembayaran.totalDibayar)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-black">
                    <span>Metode Pembayaran:</span>
                    <span className="font-bold text-black">{pembayaran.metodePembayaran}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions Note */}
            <div className="text-[8px] text-black border border-black p-1.5 rounded mb-2 leading-tight">
              <b>Ketentuan Aulia 51 Gadai:</b>
              <br />
              1. Admin 7% berlaku per 14 hari. Pinjaman diterima utuh tanpa potongan.
              <br />
              2. Batas waktu dapat diperpanjang dengan membayar administrasi 7%.
              <br />
              3. Jika tidak diperpanjang/ditebus dalam masa tenggang (14 hari setelah jatuh tempo + denda 0,8%/hari), barang akan <b>HANGUS & TERLELANG</b>.
              <div className="mt-1 pt-1 border-t border-black font-bold">
                PERPANJANG GADAI DAPAT DILAKUKAN SECARA ONLINE DENGAN MENGIRIMKAN BUKTI PEMBAYARAN MELALUI WHATSAPP.
                <br />
                DANA / OVO / GOPAY / QRIS: 0882-0058-21681
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 justify-between items-end gap-4 text-[9px] text-center text-black mt-2 border-t border-black pt-2">
              <div>
                <div className="text-black mb-8">Nasabah</div>
                <div className="font-bold border-t border-black pt-0.5 text-black">{nasabah?.nama || transaksi.namaNasabah}</div>
              </div>

              <div>
                <div className="text-black mb-8">Petugas</div>
                <div className="font-bold border-t border-black pt-0.5 text-black">Aulia 51 Gadai</div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            <Printer className="w-4 h-4" /> Cetak Nota
          </button>
          
          <button
            onClick={handleSendWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            <Send className="w-4 h-4" /> Kirim WA
          </button>

          <button
            onClick={handleSendEmail}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            <Mail className="w-4 h-4" /> Kirim Email
          </button>

          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            Selesai (Dashboard)
          </button>
        </div>

      </div>
    </div>
  );
};
