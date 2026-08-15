import { TransaksiGadai, StatusGadai } from '../types';

export const ADMIN_RATE = 0.07; // 7% per 14 hari
export const PAWN_DURATION_DAYS = 14;
export const GRACE_PERIOD_DAYS = 14; // Masa tenggang 14 hari
export const LATE_FEE_RATE_PER_DAY = 0.008; // 0.8% per hari

/**
 * Format number to Indonesian Rupiah (e.g., Rp 1.500.000)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats YYYY-MM-DD or ISO string into readable Indonesian Date string
 */
export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Helper to add days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate difference in calendar days between two dates
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string = new Date().toISOString().split('T')[0]): number {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates admin fee (7%), maturity date (14 days), and grace period end (28 days total)
 */
export function calculateNewPawn(pinjaman: number, tanggalGadai: string = new Date().toISOString().split('T')[0]) {
  const biayaAdmin = Math.round(pinjaman * ADMIN_RATE);
  const jatuhTempo = addDays(tanggalGadai, PAWN_DURATION_DAYS);
  const masaTenggangHingga = addDays(jatuhTempo, GRACE_PERIOD_DAYS);

  return {
    pinjaman,
    biayaAdmin,
    tanggalGadai,
    jatuhTempo,
    masaTenggangHingga,
    potonganAwal: 0, // Admin dibayar di belakang
    penerimaanBersih: pinjaman, // Nasabah terima FULL
  };
}

/**
 * Evaluates current status and calculates late fee (denda) dynamically based on current date
 */
export function evaluatePawnStatus(transaksi: TransaksiGadai, currentDateStr: string = new Date().toISOString().split('T')[0]): {
  status: StatusGadai;
  hariKeterlambatan: number;
  denda: number;
  biayaAdmin: number;
  totalPelunasan: number;
  totalPerpanjang: number;
} {
  // If already LUNAS or TERLELANG, return recorded state
  if (transaksi.status === 'LUNAS' || transaksi.status === 'TERLELANG') {
    return {
      status: transaksi.status,
      hariKeterlambatan: 0,
      denda: transaksi.denda || 0,
      biayaAdmin: transaksi.biayaAdmin,
      totalPelunasan: (transaksi.totalDibayar || 0),
      totalPerpanjang: transaksi.biayaAdmin + (transaksi.denda || 0),
    };
  }

  const daysPastMaturity = getDaysDifference(transaksi.jatuhTempo, currentDateStr);
  let status: StatusGadai = 'AKTIF';
  let hariKeterlambatan = 0;
  let denda = 0;

  if (daysPastMaturity <= 0) {
    // Normal active period
    status = 'AKTIF';
    hariKeterlambatan = 0;
    denda = 0;
  } else if (daysPastMaturity <= GRACE_PERIOD_DAYS) {
    // Grace period (Masa Tenggang <= 14 hari)
    status = 'TENGGANG';
    hariKeterlambatan = daysPastMaturity;
    // Denda 0.8% per hari
    denda = Math.round(transaksi.pinjaman * LATE_FEE_RATE_PER_DAY * hariKeterlambatan);
  } else {
    // Exceeded 14 days grace period -> HANGUS & ENTER LEILANG LIST
    status = 'HANGUS';
    hariKeterlambatan = GRACE_PERIOD_DAYS; // Capped at 14 days grace
    denda = Math.round(transaksi.pinjaman * LATE_FEE_RATE_PER_DAY * GRACE_PERIOD_DAYS);
  }

  const biayaAdmin = transaksi.biayaAdmin || Math.round(transaksi.pinjaman * ADMIN_RATE);
  const totalPerpanjang = biayaAdmin + denda;
  const totalPelunasan = transaksi.pinjaman + biayaAdmin + denda;

  return {
    status,
    hariKeterlambatan,
    denda,
    biayaAdmin,
    totalPelunasan,
    totalPerpanjang,
  };
}
