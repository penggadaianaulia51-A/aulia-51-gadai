import { Nasabah, TransaksiGadai, Pembayaran, AppSettings, GoogleSyncState } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1XCK7FPFOn954Uv9DDMDR86bUvivTZBj8_gwCGtWB-aA';
export const DEFAULT_DRIVE_FOLDER_ID = '1eHS4ciGArpVXE429Nom6YI4aY0Wk2HlG';

const LOCAL_STORAGE_KEY_NASABAH = 'aulia51_nasabah';
const LOCAL_STORAGE_KEY_TRANSAKSI = 'aulia51_transaksi';
const LOCAL_STORAGE_KEY_PEMBAYARAN = 'aulia51_pembayaran';
const LOCAL_STORAGE_KEY_SETTINGS = 'aulia51_settings';
const LOCAL_STORAGE_KEY_TOKEN = 'aulia51_google_token';

export const DEFAULT_SETTINGS: AppSettings = {
  namaToko: 'AULIA 51 GADAI',
  alamatToko: 'Jl. Utama Aulia 51 No. 51, Indonesia',
  noHpToko: '081234567890',
  emailToko: 'penggadaianaulia51@gmail.com',
  googleSheetId: DEFAULT_SPREADSHEET_ID,
  googleDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
  adminPersen: 7,
  durasiGadaiHari: 14,
  durasiTenggangHari: 14,
  dendaPersenPerHari: 0.8,
  syaratKetentuan: '1. Barang jaminan yang tidak ditebus/diperpanjang hingga batas akhir masa tenggang (28 hari) secara otomatis menjadi barang lelang.\n2. Pengambilan barang jaminan wajib membawa Nota Asli & Identitas Diri.\n3. Administrasi 7% berlaku per 14 hari.',
  waDefaultTemplate: 'Halo Bpk/Ibu *{NAMA}*, Terima kasih telah bertransaksi di *AULIA 51 GADAI*. No Nota: *{NO_NOTA}*, Barang: *{BARANG}*, Pinjaman: *{PINJAMAN}*, Jatuh Tempo: *{JATUH_TEMPO}*.',
  emailDefaultTemplate: 'Yth. Bapak/Ibu {NAMA},\n\nTerima kasih telah menggunakan layanan Aulia 51 Gadai. Berikut rincian transaksi Anda:\nNo Nota: {NO_NOTA}\nBarang: {BARANG}\nPinjaman: {PINJAMAN}\nJatuh Tempo: {JATUH_TEMPO}\n\nSalam,\nAulia 51 Gadai',
};

// --- LOCAL STORAGE HELPERS ---
export function getLocalNasabah(): Nasabah[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_NASABAH);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalNasabah(items: Nasabah[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_NASABAH, JSON.stringify(items));
}

export function getLocalTransaksi(): TransaksiGadai[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSAKSI);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalTransaksi(items: TransaksiGadai[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_TRANSAKSI, JSON.stringify(items));
}

export function getLocalPembayaran(): Pembayaran[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_PEMBAYARAN);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalPembayaran(items: Pembayaran[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_PEMBAYARAN, JSON.stringify(items));
}

export function getLocalSettings(): AppSettings {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    if (!parsed.googleSheetId || parsed.googleSheetId === '1fqGlbuu2hxGolQQU0TVykzPufQrx_3GVEEk04Cvvmzc') {
      parsed.googleSheetId = DEFAULT_SPREADSHEET_ID;
      localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: AppSettings): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

export function getSavedGoogleToken(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEY_TOKEN);
}

export function saveGoogleToken(token: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, token);
}

export function removeGoogleToken(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);
}

// --- GOOGLE SHEETS API CALLS ---

/**
 * Initializes Sheet columns, headers, and tabs if they don't exist in Google Spreadsheet
 */
export async function initializeGoogleSheet(sheetId: string, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;

  const headersMap: Record<string, string[]> = {
    NASABAH: [
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'JENIS IDENTITAS (KTP/SIM/BPJS/PASPOR)',
      'NO IDENTITAS (NIK/NO KTP)',
      'TANGGAL LAHIR',
      'DUSUN / JLN',
      'RT / RW',
      'DESA / KELURAHAN',
      'KECAMATAN',
      'KABUPATEN / KOTA',
      'PROVINSI',
      'ALAMAT DOMISILI LENGKAP',
      'NO HP / WHATSAPP',
      'EMAIL',
      'LINK FOTO DOKUMEN (GOOGLE DRIVE)',
      'TANGGAL TERDAFTAR'
    ],
    TRANSAKSI_GADAI: [
      'NO NOTA / ID TRANSAKSI',
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'NO HP / WHATSAPP',
      'JENIS BARANG JAMINAN',
      'MERK / BRAND',
      'TYPE / SERI BARANG',
      'IMEI / NOMOR SERI (SN)',
      'WARNA BARANG',
      'PERLENGKAPAN BARANG',
      'PIN / PASSCODE HP',
      'POLA LAYAR (3X3)',
      'NOMINAL PINJAMAN (RP)',
      'BIAYA ADMIN 7% (RP)',
      'TANGGAL AKAD GADAI',
      'TANGGAL JATUH TEMPO (+14 HARI)',
      'BATAS MASA TENGGANG (+28 HARI)',
      'STATUS TRANSAKSI (AKTIF/TENGGANG/HANGUS/TERLELANG/LUNAS)',
      'DENDA KETERLAMBATAN (RP)',
      'TOTAL DIBAYAR (RP)',
      'TANGGAL SELESAI / PELUNASAN',
      'PETUGAS KASIR'
    ],
    PEMBAYARAN: [
      'ID NOTA PEMBAYARAN',
      'ID TRANSAKSI GADAI',
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'JENIS TRANSAKSI (PERPANJANG / PELUNASAN)',
      'BIAYA ADMINISTRASI 7% (RP)',
      'DENDA KETERLAMBATAN (RP)',
      'PELUNASAN POKOK (RP)',
      'TOTAL NOMINAL DIBAYAR (RP)',
      'METODE PEMBAYARAN',
      'RINCIAN METODE PEMBAYARAN',
      'TANGGAL PEMBAYARAN',
      'PETUGAS KASIR'
    ],
    PENGATURAN: [
      'PARAMETER PENGATURAN',
      'NILAI CONFIGURATION'
    ]
  };

  try {
    // 1. Fetch current spreadsheet tabs and properties
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`;
    const metaResp = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let existingSheets: Array<{ sheetId: number; title: string }> = [];
    if (metaResp.ok) {
      const metaData = await metaResp.json();
      existingSheets = (metaData.sheets || []).map((s: any) => ({
        sheetId: s.properties.sheetId,
        title: s.properties.title
      }));
    }

    // 2. Add missing tabs
    const targetTabs = ['NASABAH', 'TRANSAKSI_GADAI', 'PEMBAYARAN', 'PENGATURAN'];
    const addSheetRequests: any[] = [];

    for (const tabName of targetTabs) {
      if (!existingSheets.some((s) => s.title === tabName)) {
        addSheetRequests.push({ addSheet: { properties: { title: tabName } } });
      }
    }

    if (addSheetRequests.length > 0) {
      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
      await fetch(batchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: addSheetRequests })
      });

      // Refetch sheets metadata
      const reMeta = await fetch(metaUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (reMeta.ok) {
        const reData = await reMeta.json();
        existingSheets = (reData.sheets || []).map((s: any) => ({
          sheetId: s.properties.sheetId,
          title: s.properties.title
        }));
      }
    }

    // 3. For each tab, check if row 1 contains data instead of headers
    const formatRequests: any[] = [];

    for (const sheetObj of existingSheets) {
      const tabName = sheetObj.title;
      if (!headersMap[tabName]) continue;

      // Read A1 cell
      const valUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}!A1:A1`;
      const valResp = await fetch(valUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

      let needShiftDown = false;
      if (valResp.ok) {
        const valData = await valResp.json();
        const firstVal = valData.values?.[0]?.[0] || '';
        // If A1 contains actual data (e.g. NSB-, GD-, BYR-) and not header text, shift row down
        if (
          firstVal &&
          !firstVal.toUpperCase().includes('ID') &&
          !firstVal.toUpperCase().includes('NO NOTA') &&
          !firstVal.toUpperCase().includes('PARAMETER')
        ) {
          needShiftDown = true;
        }
      }

      if (needShiftDown) {
        formatRequests.push({
          insertDimension: {
            range: {
              sheetId: sheetObj.sheetId,
              dimension: 'ROWS',
              startIndex: 0,
              endIndex: 1
            },
            inheritFromBefore: false
          }
        });
      }

      // Add cell styling for row 1 (Bold, Navy background, White text)
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: sheetObj.sheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.1, green: 0.22, blue: 0.45 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      });
    }

    if (formatRequests.length > 0) {
      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
      try {
        await fetch(batchUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests: formatRequests })
        });
      } catch {
        // Ignore format request failures
      }
    }

    // 4. Update Header Values in Row 1 for all tabs
    const updateValuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
    const updateBody = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'NASABAH!A1:P1', values: [headersMap.NASABAH] },
        { range: 'TRANSAKSI_GADAI!A1:T1', values: [headersMap.TRANSAKSI_GADAI] },
        { range: 'PEMBAYARAN!A1:M1', values: [headersMap.PEMBAYARAN] },
        { range: 'PENGATURAN!A1:B1', values: [headersMap.PENGATURAN] }
      ]
    };

    const writeResp = await fetch(updateValuesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    });

    return writeResp.ok;
  } catch (err) {
    console.error('Failed to initialize Google Sheet headers:', err);
    return false;
  }
}

async function addMissingSheetsIfNotExist(sheetId: string, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
  const body = {
    requests: [
      { addSheet: { properties: { title: 'NASABAH' } } },
      { addSheet: { properties: { title: 'TRANSAKSI_GADAI' } } },
      { addSheet: { properties: { title: 'PEMBAYARAN' } } },
      { addSheet: { properties: { title: 'PENGATURAN' } } },
    ]
  };
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    // Ignore if sheets already exist
  }
}

export async function resetAndSyncSpreadsheet(
  sheetId: string,
  accessToken: string,
  nasabahList: Nasabah[],
  transaksiList: TransaksiGadai[],
  pembayaranList: Pembayaran[]
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken) {
    return { success: false, error: 'Google Access Token tidak tersedia.' };
  }

  const headersMap = {
    NASABAH: [
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'JENIS IDENTITAS (KTP/SIM/BPJS/PASPOR)',
      'NO IDENTITAS (NIK/NO KTP)',
      'TANGGAL LAHIR',
      'DUSUN / JLN',
      'RT / RW',
      'DESA / KELURAHAN',
      'KECAMATAN',
      'KABUPATEN / KOTA',
      'PROVINSI',
      'ALAMAT DOMISILI LENGKAP',
      'NO HP / WHATSAPP',
      'EMAIL',
      'LINK FOTO DOKUMEN (GOOGLE DRIVE)',
      'TANGGAL TERDAFTAR'
    ],
    TRANSAKSI_GADAI: [
      'NO NOTA / ID TRANSAKSI',
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'NO HP / WHATSAPP',
      'JENIS BARANG JAMINAN',
      'MERK / BRAND',
      'TYPE / SERI BARANG',
      'IMEI / NOMOR SERI (SN)',
      'WARNA BARANG',
      'PERLENGKAPAN BARANG',
      'PIN / PASSCODE HP',
      'POLA LAYAR (3X3)',
      'NOMINAL PINJAMAN (RP)',
      'BIAYA ADMIN 7% (RP)',
      'TANGGAL AKAD GADAI',
      'TANGGAL JATUH TEMPO (+14 HARI)',
      'BATAS MASA TENGGANG (+28 HARI)',
      'STATUS TRANSAKSI',
      'DENDA KETERLAMBATAN (RP)',
      'TOTAL DIBAYAR (RP)',
      'TANGGAL SELESAI / PELUNASAN',
      'PETUGAS KASIR'
    ],
    PEMBAYARAN: [
      'ID NOTA PEMBAYARAN',
      'ID TRANSAKSI GADAI',
      'ID NASABAH',
      'NAMA LENGKAP NASABAH',
      'JENIS TRANSAKSI',
      'BIAYA ADMINISTRASI 7% (RP)',
      'DENDA KETERLAMBATAN (RP)',
      'PELUNASAN POKOK (RP)',
      'TOTAL NOMINAL DIBAYAR (RP)',
      'METODE PEMBAYARAN',
      'RINCIAN METODE PEMBAYARAN',
      'TANGGAL PEMBAYARAN',
      'PETUGAS KASIR'
    ],
    PENGATURAN: [
      'PARAMETER PENGATURAN',
      'NILAI CONFIGURATION'
    ]
  };

  try {
    // 1. Ensure missing tabs exist
    await addMissingSheetsIfNotExist(sheetId, accessToken);

    // 2. Clear all sheets contents across A1:ZZ10000
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchClear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: [
          'NASABAH!A1:ZZ10000',
          'TRANSAKSI_GADAI!A1:ZZ10000',
          'PEMBAYARAN!A1:ZZ10000',
          'PENGATURAN!A1:ZZ10000',
          'Sheet1!A1:ZZ10000'
        ]
      })
    });

    // 3. Format Row 1 styling (Bold, Navy background, White foreground, Center aligned)
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`;
    const metaResp = await fetch(metaUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (metaResp.ok) {
      const metaData = await metaResp.json();
      const formatRequests = (metaData.sheets || []).map((s: any) => ({
        repeatCell: {
          range: {
            sheetId: s.properties.sheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.1, green: 0.22, blue: 0.45 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      }));

      if (formatRequests.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests: formatRequests })
        });
      }
    }

    // 4. Construct dataset to write from Row 1
    const nasabahRows: any[][] = [headersMap.NASABAH];
    for (const n of nasabahList) {
      nasabahRows.push([
        n.id,
        n.nama,
        n.jenisIdentitas,
        n.nomorIdentitas,
        n.tanggalLahir,
        n.dusun,
        n.rtRw,
        n.desa,
        n.kecamatan,
        n.kabupaten,
        n.provinsi,
        n.domisili,
        n.noHp,
        n.email,
        n.urlDokumen || '',
        n.tanggalDaftar
      ]);
    }

    const transaksiRows: any[][] = [headersMap.TRANSAKSI_GADAI];
    for (const tx of transaksiList) {
      transaksiRows.push([
        tx.id,
        tx.idNasabah,
        tx.namaNasabah,
        tx.noHp,
        tx.jenisBarang,
        tx.brand,
        tx.typeSeri,
        tx.imeiSn,
        tx.warna,
        Array.isArray(tx.perlengkapan) ? tx.perlengkapan.join(', ') : tx.perlengkapan,
        tx.pinjaman,
        tx.biayaAdmin,
        tx.tanggalGadai,
        tx.jatuhTempo,
        tx.masaTenggangHingga,
        tx.status,
        tx.denda || 0,
        tx.totalDibayar || 0,
        tx.tanggalSelesai || '',
        tx.petugas || 'Admin'
      ]);
    }

    const pembayaranRows: any[][] = [headersMap.PEMBAYARAN];
    for (const p of pembayaranList) {
      pembayaranRows.push([
        p.id,
        p.idTransaksi,
        p.idNasabah,
        p.namaNasabah,
        p.jenisTransaksi,
        p.biayaAdmin,
        p.denda,
        p.pelunasanPokok,
        p.totalDibayar,
        p.metodePembayaran,
        p.rincianMetode || '',
        p.tanggalPembayaran,
        p.petugas
      ]);
    }

    const pengaturanRows: any[][] = [
      headersMap.PENGATURAN,
      ['BIAYA ADMIN DEFAULT', '7%'],
      ['JATUH TEMPO DEFAULT', '14 Hari'],
      ['MASA TENGGANG DEFAULT', '28 Hari']
    ];

    // 5. Write everything cleanly using PUT values:batchUpdate
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
    const updateBody = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `NASABAH!A1:P${nasabahRows.length}`, values: nasabahRows },
        { range: `TRANSAKSI_GADAI!A1:T${transaksiRows.length}`, values: transaksiRows },
        { range: `PEMBAYARAN!A1:M${pembayaranRows.length}`, values: pembayaranRows },
        { range: `PENGATURAN!A1:B${pengaturanRows.length}`, values: pengaturanRows }
      ]
    };

    const res = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return { success: false, error: errTxt };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Reset and sync spreadsheet failed:', err);
    return { success: false, error: err.message || 'Gagal meriset spreadsheet' };
  }
}

/**
 * Appends a Nasabah record row to Google Sheet
 */
export async function appendNasabahToSheet(nasabah: Nasabah, sheetId: string, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/NASABAH!A1:P:append?valueInputOption=USER_ENTERED`;

  const values = [[
    nasabah.id,
    nasabah.nama,
    nasabah.jenisIdentitas,
    nasabah.nomorIdentitas,
    nasabah.tanggalLahir,
    nasabah.dusun,
    nasabah.rtRw,
    nasabah.desa,
    nasabah.kecamatan,
    nasabah.kabupaten,
    nasabah.provinsi,
    nasabah.domisili,
    nasabah.noHp,
    nasabah.email,
    nasabah.urlDokumen || '',
    nasabah.tanggalDaftar
  ]];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
    return res.ok;
  } catch (err) {
    console.error('Error appending Nasabah to Google Sheet:', err);
    return false;
  }
}

/**
 * Appends a Transaksi Gadai row to Google Sheet
 */
export async function appendTransaksiToSheet(tx: TransaksiGadai, sheetId: string, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/TRANSAKSI_GADAI!A:T:append?valueInputOption=USER_ENTERED`;

  const values = [[
    tx.id,
    tx.idNasabah,
    tx.namaNasabah,
    tx.noHp,
    tx.jenisBarang,
    tx.brand,
    tx.typeSeri,
    tx.imeiSn,
    tx.warna,
    Array.isArray(tx.perlengkapan) ? tx.perlengkapan.join(', ') : tx.perlengkapan,
    tx.pinHp || '',
    tx.polaHp && tx.polaHp.length > 0 ? tx.polaHp.map((d) => d + 1).join('-') : '',
    tx.pinjaman,
    tx.biayaAdmin,
    tx.tanggalGadai,
    tx.jatuhTempo,
    tx.masaTenggangHingga,
    tx.status,
    tx.denda || 0,
    tx.totalDibayar || 0,
    tx.tanggalSelesai || '',
    tx.petugas || 'Admin'
  ]];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
    return res.ok;
  } catch (err) {
    console.error('Error appending Transaksi to Google Sheet:', err);
    return false;
  }
}

/**
 * Appends a Pembayaran row to Google Sheet
 */
export async function appendPembayaranToSheet(p: Pembayaran, sheetId: string, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/PEMBAYARAN!A:L:append?valueInputOption=USER_ENTERED`;

  const values = [[
    p.id,
    p.idTransaksi,
    p.idNasabah,
    p.namaNasabah,
    p.jenisTransaksi,
    p.biayaAdmin,
    p.denda,
    p.pelunasanPokok,
    p.totalDibayar,
    p.metodePembayaran,
    p.rincianMetode || '',
    p.tanggalPembayaran,
    p.petugas
  ]];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
    return res.ok;
  } catch (err) {
    console.error('Error appending Pembayaran to Google Sheet:', err);
    return false;
  }
}

/**
 * Uploads document/media file directly to Google Drive folder (1eHS4ciGArpVXE429Nom6YI4aY0Wk2HlG)
 */
export async function uploadFileToGoogleDrive(
  file: File,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
  accessToken: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  if (!accessToken) {
    return { success: false, error: 'Google Access Token tidak ditemukan' };
  }

  try {
    const metadata = {
      name: `AULIA51_${Date.now()}_${file.name}`,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink';

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload Drive gagal: ${response.statusText} - ${errText}`);
    }

    const result = await response.json();
    const fileUrl = result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;
    return { success: true, fileUrl };
  } catch (error: any) {
    console.error('Error uploading file to Google Drive:', error);
    return { success: false, error: error.message || 'Gagal mengupload ke Google Drive' };
  }
}

/**
 * Validates connectivity to Google Spreadsheet
 */
export async function testGoogleSpreadsheetConnection(sheetId: string, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=spreadsheetId,properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}
