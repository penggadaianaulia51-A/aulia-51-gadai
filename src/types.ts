export type StatusGadai = 'AKTIF' | 'TENGGANG' | 'HANGUS' | 'TERLELANG' | 'LUNAS';

export type JenisIdentitas = 'KTP' | 'SIM' | 'BPJS' | 'PASPOR';

export type JenisBarang = 'HP' | 'LAPTOP' | 'KAMERA' | 'TABLET' | 'TV / ELEKTRONIK' | 'LAINNYA';

export type Perlengkapan = 'FULLSET' | 'ADAPTOR' | 'KABEL' | 'KARDUS' | 'TAS/CASE' | 'TIDAK ADA';

export type MetodePembayaran = 'CASH' | 'TRANSFER' | 'QRIS' | 'E-WALLET' | 'CASH+NON TUNAI';

export interface Nasabah {
  id: string; // ID NASABAH (e.g. NSB-20260812-001)
  nama: string;
  jenisIdentitas: JenisIdentitas;
  nomorIdentitas: string;
  tanggalLahir: string;
  dusun: string;
  rtRw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  domisili: string;
  noHp: string;
  email: string;
  urlDokumen?: string;
  tanggalDaftar: string;
}

export interface TransaksiGadai {
  id: string; // ID TRANSAKSI (e.g. GD-20260812-001)
  idNasabah: string;
  namaNasabah: string;
  noHp: string;
  jenisBarang: JenisBarang;
  brand: string;
  typeSeri: string;
  imeiSn: string;
  warna: string;
  perlengkapan: string[]; // ['FULLSET', 'ADAPTOR', ...]
  pinjaman: number; // Rp
  biayaAdmin: number; // 7% dari pinjaman
  tanggalGadai: string; // ISO / YYYY-MM-DD
  jatuhTempo: string; // 14 hari dari tanggal gadai
  masaTenggangHingga: string; // 14 hari setelah jatuh tempo
  status: StatusGadai;
  denda: number; // 0.8% per hari masa tenggang
  totalDibayar?: number;
  tanggalSelesai?: string;
  petugas: string;
  catatan?: string;
  pinHp?: string; // PIN / Password kunci HP / Laptop
  polaHp?: number[]; // Array urutan titik pola 3x3 (0-8)
}

export interface Pembayaran {
  id: string; // ID PEMBAYARAN (e.g. BYR-20260812-001)
  idTransaksi: string;
  idNasabah: string;
  namaNasabah: string;
  jenisTransaksi: 'PERPANJANG' | 'PELUNASAN';
  biayaAdmin: number;
  denda: number;
  pelunasanPokok: number;
  totalDibayar: number;
  metodePembayaran: MetodePembayaran;
  rincianMetode?: string; // e.g. Cash: Rp 100k, QRIS: Rp 50k
  tanggalPembayaran: string;
  petugas: string;
  catatan?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  namaLengkap: string;
  role: 'ADMIN' | 'KASIR' | 'MANAGER';
  hakAkses: string[]; // Array menu keys: DASHBOARD, INPUT_NASABAH, GADAI_BARU, PERPANJANG, PELUNASAN, BARANG_JAMINAN, LAPORAN, CETAK_ULANG, PENGATURAN, HAPUS_TRANSAKSI
}

export interface AppSettings {
  namaToko: string;
  alamatToko: string;
  noHpToko: string;
  emailToko: string;
  googleSheetId: string;
  googleDriveFolderId: string;
  adminPersen: number; // 7
  durasiGadaiHari: number; // 14
  durasiTenggangHari: number; // 14
  dendaPersenPerHari: number; // 0.8
  syaratKetentuan: string;
  waApiKey?: string;
  waDefaultTemplate: string;
  emailDefaultTemplate: string;
}

export interface GoogleSyncState {
  isConnected: boolean;
  sheetSynced: boolean;
  driveSynced: boolean;
  lastSyncTime?: string;
  errorMessage?: string;
  accessToken?: string;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
}
