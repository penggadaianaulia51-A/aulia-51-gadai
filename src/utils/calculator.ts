import { TransaksiGadai, StatusGadai } from '../types';

export const ADMIN_RATE = 0.07; // 7% per 14 hari
export const PAWN_DURATION_DAYS = 14;
export const GRACE_PERIOD_DAYS = 14; // Masa tenggang 14 hari
export const LATE_FEE_RATE_PER_DAY = 0.008; // 0.8% per hari

/**
 * Helper to parse YYYY-MM-DD into a UTC Date object (prevents timezone shifts)
 */
export function parseDateUTC(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  return new Date(dateStr);
}

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
    const d = parseDateUTC(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Helper to add days to a date string (YYYY-MM-DD) cleanly in UTC
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate difference in calendar days between two dates (toDate - fromDate)
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string = new Date().toISOString().split('T')[0]): number {
  if (!fromDateStr || !toDateStr) return 0;
  const from = parseDateUTC(fromDateStr);
  const to = parseDateUTC(toDateStr);
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates admin fee (7%), maturity date (+14 days), and grace period end (+28 days total)
 * Example:
 *  - tanggalGadai: 22 Juli 2026
 *  - jatuhTempo: 05 Agustus 2026 (+14 hari, AKTIF)
 *  - masaTenggangHingga: 19 Agustus 2026 (+14 hari dari jatuh tempo, TENGGANG)
 *  - 20 Agustus 2026: HANGUS & TERLELANG
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
    potonganAwal: 0,
    penerimaanBersih: pinjaman,
  };
}

/**
 * Evaluates current status and calculates late fee (denda) dynamically based on current date
 * Status Rules:
 *  1. currentDate <= jatuhTempo (05 Agustus): AKTIF (Denda = 0)
 *  2. jatuhTempo < currentDate <= masaTenggangHingga (06 Agustus s/d 19 Agustus): TENGGANG (Denda 0.8%/hari)
 *  3. currentDate > masaTenggangHingga (20 Agustus ke atas): HANGUS
 */
export function evaluatePawnStatus(
  transaksi: TransaksiGadai,
  currentDateStr: string = new Date().toISOString().split('T')[0]
): {
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
      totalPelunasan: transaksi.totalDibayar || 0,
      totalPerpanjang: transaksi.biayaAdmin + (transaksi.denda || 0),
    };
  }

  const daysPastMaturity = getDaysDifference(transaksi.jatuhTempo, currentDateStr);
  let status: StatusGadai = 'AKTIF';
  let hariKeterlambatan = 0;
  let denda = 0;

  if (daysPastMaturity <= 0) {
    // Normal active period (Hingga tanggal Jatuh Tempo, e.g. 05 Agustus)
    status = 'AKTIF';
    hariKeterlambatan = 0;
    denda = 0;
  } else if (daysPastMaturity <= GRACE_PERIOD_DAYS) {
    // Grace period (Hari ke-1 s/d 14 setelah Jatuh Tempo, e.g. 06 s/d 19 Agustus)
    status = 'TENGGANG';
    hariKeterlambatan = daysPastMaturity;
    denda = Math.round(transaksi.pinjaman * LATE_FEE_RATE_PER_DAY * hariKeterlambatan);
  } else {
    // Exceeded 14 days grace period (Hari ke-15 setelah Jatuh Tempo / 20 Agustus ke atas) -> HANGUS!
    status = 'HANGUS';
    hariKeterlambatan = GRACE_PERIOD_DAYS; // Cap denda at 14 days
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
