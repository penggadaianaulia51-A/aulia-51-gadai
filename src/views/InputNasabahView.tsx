import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { PROVINSI_INDONESIA } from '../data/indonesiaProvinces';
import { JenisIdentitas, Nasabah } from '../types';
import { UserPlus, Upload, CheckCircle2, ArrowRight, Loader2, FileText, Image } from 'lucide-react';

interface InputNasabahViewProps {
  onSuccessNavigateToGadai: (nasabahId: string) => void;
}

export const InputNasabahView: React.FC<InputNasabahViewProps> = ({ onSuccessNavigateToGadai }) => {
  const { addNasabah, nasabahList, syncState } = useSync();

  // Auto-generate ID Nasabah (e.g., NSB-YYYYMMDD-001)
  const generateNewId = (): string => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = nasabahList.length + 1;
    const seq = String(count).padStart(3, '0');
    return `NSB-${today}-${seq}`;
  };

  const [idNasabah] = useState<string>(generateNewId());
  const [nama, setNama] = useState('');
  const [jenisIdentitas, setJenisIdentitas] = useState<JenisIdentitas>('KTP');
  const [nomorIdentitas, setNomorIdentitas] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [dusun, setDusun] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [domisili, setDomisili] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setFilePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nomorIdentitas || !noHp) {
      alert('Mohon lengkapi Nama, Nomor Identitas, dan No HP Nasabah!');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    const newNasabah: Nasabah = {
      id: idNasabah,
      nama,
      jenisIdentitas,
      nomorIdentitas,
      tanggalLahir,
      dusun,
      rtRw,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      domisili: domisili || `${dusun}, Desa ${desa}, Kec. ${kecamatan}, ${kabupaten}`,
      noHp,
      email,
      tanggalDaftar: new Date().toISOString().split('T')[0],
    };

    const res = await addNasabah(newNasabah, selectedFile || undefined);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Data Nasabah berhasil disimpan ke Google Sheet & Drive!');
      setTimeout(() => {
        // Automatically open new pawn registration for this newly saved customer!
        onSuccessNavigateToGadai(idNasabah);
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <UserPlus className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Input Nasabah Baru</h2>
            <p className="text-xs text-blue-200">
              Pendaftaran data identitas nasabah Aulia 51 Gadai
            </p>
          </div>
        </div>

        <div className="bg-blue-800/80 px-3 py-1.5 rounded-lg border border-blue-400/30 text-right">
          <span className="text-[10px] text-blue-200 uppercase block font-semibold">ID NASABAH</span>
          <span className="font-mono font-bold text-sm text-amber-300">{idNasabah}</span>
        </div>
      </div>

      {successMessage && (
        <div className="m-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 flex items-center gap-3 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Membuka Pendaftaran Gadai Baru...</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Identitas Utama */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Identitas Utama
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Lengkap Nasabah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Sesuai KTP / SIM"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jenis Identitas <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisIdentitas}
                  onChange={(e) => setJenisIdentitas(e.target.value as JenisIdentitas)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold"
                >
                  <option value="KTP">KTP</option>
                  <option value="SIM">SIM</option>
                  <option value="BPJS">BPJS</option>
                  <option value="PASPOR">PASPOR</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Identitas NIK/No.Doc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="3201xxxxxxxxxxxx"
                  value={nomorIdentitas}
                  onChange={(e) => setNomorIdentitas(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  No. HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0812xxxxxxxx"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="nasabah@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alamat Lengkap */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Alamat Sesuai Identitas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Dusun / Jalan</label>
              <input
                type="text"
                placeholder="Dusun Krajan"
                value={dusun}
                onChange={(e) => setDusun(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">RT / RW</label>
              <input
                type="text"
                placeholder="RT 02 / RW 05"
                value={rtRw}
                onChange={(e) => setRtRw(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                placeholder="Desa Suka Maju"
                value={desa}
                onChange={(e) => setDesa(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kecamatan</label>
              <input
                type="text"
                placeholder="Kecamatan Cibinong"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                placeholder="Kabupaten Bogor"
                value={kabupaten}
                onChange={(e) => setKabupaten(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Provinsi</label>
              <select
                value={provinsi}
                onChange={(e) => setProvinsi(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PROVINSI_INDONESIA.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili Sekarang (Jika Beda)</label>
              <input
                type="text"
                placeholder="Kos/Kontrakan/Alamat sekarang jika tidak sesuai KTP"
                value={domisili}
                onChange={(e) => setDomisili(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Document Upload to Google Drive */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Upload Foto Dokumen Pendaftaran
            </span>
            <span className="text-xs text-blue-700 font-normal">
              Folder Drive: <code>1eHS4ciGArpVXE429Nom6YI4aY0Wk2HlG</code>
            </span>
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-blue-600" />
              <div className="text-xs font-bold text-gray-700">
                {selectedFile ? selectedFile.name : 'Pilih Foto KTP / SIM / Dokumen Nasabah'}
              </div>
              <p className="text-[11px] text-gray-400">
                Format file JPG, PNG, atau PDF. Maksimal 10MB. File otomatis tersimpan ke Google Drive.
              </p>
            </div>
          </div>

          {filePreview && (
            <div className="mt-2 p-2 border border-gray-200 rounded-xl inline-block bg-slate-50">
              <span className="text-xs font-bold text-gray-500 block mb-1">Preview Dokumen:</span>
              <img src={filePreview} alt="Preview" className="h-32 object-contain rounded border" />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan ke Google Sheet...
              </>
            ) : (
              <>
                SIMPAN & KANJUTKAN KE GADAI BARU <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
