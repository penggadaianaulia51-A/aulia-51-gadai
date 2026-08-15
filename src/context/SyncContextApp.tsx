import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSyncState, Nasabah, TransaksiGadai, Pembayaran, AppSettings, UserAccount } from '../types';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_DRIVE_FOLDER_ID,
  getSavedGoogleToken,
  saveGoogleToken,
  removeGoogleToken,
  testGoogleSpreadsheetConnection,
  initializeGoogleSheet,
  getLocalNasabah,
  saveLocalNasabah,
  getLocalTransaksi,
  saveLocalTransaksi,
  getLocalPembayaran,
  saveLocalPembayaran,
  getLocalSettings,
  saveLocalSettings,
  appendNasabahToSheet,
  appendTransaksiToSheet,
  appendPembayaranToSheet,
  uploadFileToGoogleDrive,
  resetAndSyncSpreadsheet
} from '../utils/googleSync';
import { evaluatePawnStatus } from '../utils/calculator';
import {
  triggerGoogleLogin,
  getLocalUserInfo,
  saveLocalUserInfo,
  removeLocalUserInfo,
  fetchGoogleUserProfile,
  GoogleUserInfo
} from '../utils/googleAuth';

const LOCAL_STORAGE_KEY_USERS = 'aulia51_users';
const LOCAL_STORAGE_KEY_ACTIVE_USER = 'aulia51_active_user';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'admin123',
    namaLengkap: 'Administrator Utama',
    role: 'ADMIN',
    hakAkses: ['ALL', 'DASHBOARD', 'INPUT_NASABAH', 'GADAI_BARU', 'PERPANJANG', 'PELUNASAN', 'BARANG_JAMINAN', 'LAPORAN', 'CETAK_ULANG', 'PENGATURAN', 'HAPUS_TRANSAKSI'],
  },
  {
    id: 'USR-002',
    username: 'kasir',
    password: 'kasir123',
    namaLengkap: 'Kasir Toko',
    role: 'KASIR',
    hakAkses: ['DASHBOARD', 'INPUT_NASABAH', 'GADAI_BARU', 'PERPANJANG', 'PELUNASAN', 'BARANG_JAMINAN', 'CETAK_ULANG'],
  },
];

export function getLocalUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    if (!data) return DEFAULT_USERS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveLocalUsers(users: UserAccount[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
}

export function getLocalActiveUser(availableUsers: UserAccount[]): UserAccount | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_USER);
    if (!data) return availableUsers[0] || DEFAULT_USERS[0];
    const parsed = JSON.parse(data);
    const found = availableUsers.find((u) => u.id === parsed.id || u.username === parsed.username);
    return found || availableUsers[0] || DEFAULT_USERS[0];
  } catch {
    return availableUsers[0] || DEFAULT_USERS[0];
  }
}

export function saveLocalActiveUser(user: UserAccount | null): void {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_USER);
  }
}

interface SyncContextType {
  syncState: GoogleSyncState;
  nasabahList: Nasabah[];
  transaksiList: TransaksiGadai[];
  pembayaranList: Pembayaran[];
  settings: AppSettings;
  userAccounts: UserAccount[];
  activeUser: UserAccount | null;
  loginAppUser: (username: string, password: string) => { success: boolean; error?: string };
  logoutAppUser: () => void;
  addUserAccount: (user: Omit<UserAccount, 'id'>) => { success: boolean; error?: string };
  updateUserAccount: (user: UserAccount) => { success: boolean; error?: string };
  deleteUserAccount: (id: string) => { success: boolean; error?: string };
  hasPermission: (permissionKey: string) => boolean;
  loginWithGoogle: () => Promise<boolean>;
  connectGoogleToken: (token: string) => Promise<boolean>;
  disconnectGoogle: () => void;
  initSheetHeaders: () => Promise<boolean>;
  resetSpreadsheetData: () => Promise<{ success: boolean; error?: string }>;
  syncAllDataToSheet: () => Promise<void>;
  addNasabah: (nasabah: Nasabah, docFile?: File) => Promise<{ success: boolean; urlDokumen?: string; error?: string }>;
  addTransaksiGadai: (tx: TransaksiGadai) => Promise<{ success: boolean; error?: string }>;
  deleteTransaksiGadai: (id: string) => Promise<{ success: boolean; error?: string }>;
  processPembayaran: (pembayaran: Pembayaran, updatedStatus: 'AKTIF' | 'LUNAS') => Promise<{ success: boolean; error?: string }>;
  updateSettings: (newSettings: AppSettings) => void;
  manualRefreshStatus: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getSavedGoogleToken());
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(getLocalUserInfo());
  const [nasabahList, setNasabahList] = useState<Nasabah[]>(getLocalNasabah());
  const [transaksiList, setTransaksiList] = useState<TransaksiGadai[]>(getLocalTransaksi());
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>(getLocalPembayaran());
  const [settings, setSettings] = useState<AppSettings>(getLocalSettings());

  // User accounts & Active Session
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => getLocalUsers());
  const [activeUser, setActiveUser] = useState<UserAccount | null>(() => getLocalActiveUser(userAccounts));

  const [syncState, setSyncState] = useState<GoogleSyncState>({
    isConnected: false,
    sheetSynced: false,
    driveSynced: false,
    errorMessage: 'Aplikasi belum terhubung dengan Google Sheet & Google Drive.',
    accessToken: token || undefined,
    userEmail: userInfo?.email,
    userName: userInfo?.name,
    userPicture: userInfo?.picture,
  });

  // Evaluate pawn expiration statuses dynamically on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let updated = false;

    const evaluated = transaksiList.map((tx) => {
      if (tx.status === 'LUNAS' || tx.status === 'TERLELANG') return tx;
      const { status, denda } = evaluatePawnStatus(tx, today);
      if (tx.status !== status || tx.denda !== denda) {
        updated = true;
        return { ...tx, status, denda };
      }
      return tx;
    });

    if (updated) {
      setTransaksiList(evaluated);
      saveLocalTransaksi(evaluated);
    }
  }, []);

  // Validate token connection on start
  useEffect(() => {
    async function checkConn() {
      if (!token) {
        setSyncState({
          isConnected: false,
          sheetSynced: false,
          driveSynced: false,
          errorMessage: 'Belum login Google. Silakan klik "Login dengan Google".',
        });
        return;
      }

      const isOk = await testGoogleSpreadsheetConnection(settings.googleSheetId, token);
      if (isOk) {
        let currentInfo = userInfo;
        if (!currentInfo) {
          currentInfo = await fetchGoogleUserProfile(token);
          if (currentInfo) {
            setUserInfo(currentInfo);
            saveLocalUserInfo(currentInfo);
          }
        }

        setSyncState({
          isConnected: true,
          sheetSynced: true,
          driveSynced: true,
          accessToken: token,
          userEmail: currentInfo?.email || 'penggadaianaulia51@gmail.com',
          userName: currentInfo?.name || 'Aulia 51',
          userPicture: currentInfo?.picture,
          lastSyncTime: new Date().toLocaleTimeString('id-ID'),
        });
        await initializeGoogleSheet(settings.googleSheetId, token);
      } else {
        setSyncState({
          isConnected: false,
          sheetSynced: false,
          driveSynced: false,
          errorMessage: 'Sesi Google telah berakhir. Silakan login kembali.',
        });
      }
    }
    checkConn();
  }, [token, settings.googleSheetId]);

  // --- USER AUTHENTICATION & PERMISSION METHODS ---
  const loginAppUser = (usernameInput: string, passwordInput: string) => {
    const trimmedUsername = usernameInput.trim().toLowerCase();
    const found = userAccounts.find(
      (u) => u.username.toLowerCase() === trimmedUsername && u.password === passwordInput
    );
    if (!found) {
      return { success: false, error: 'Username atau Password salah!' };
    }
    setActiveUser(found);
    saveLocalActiveUser(found);
    return { success: true };
  };

  const logoutAppUser = () => {
    setActiveUser(null);
    saveLocalActiveUser(null);
  };

  const addUserAccount = (user: Omit<UserAccount, 'id'>) => {
    if (userAccounts.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
      return { success: false, error: 'Username sudah digunakan!' };
    }
    const newUser: UserAccount = {
      ...user,
      id: `USR-${Date.now().toString().slice(-4)}`,
    };
    const newList = [...userAccounts, newUser];
    setUserAccounts(newList);
    saveLocalUsers(newList);
    return { success: true };
  };

  const updateUserAccount = (updatedUser: UserAccount) => {
    const existsOther = userAccounts.some(
      (u) => u.id !== updatedUser.id && u.username.toLowerCase() === updatedUser.username.toLowerCase()
    );
    if (existsOther) {
      return { success: false, error: 'Username sudah digunakan pengguna lain!' };
    }
    const newList = userAccounts.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUserAccounts(newList);
    saveLocalUsers(newList);

    if (activeUser?.id === updatedUser.id) {
      setActiveUser(updatedUser);
      saveLocalActiveUser(updatedUser);
    }
    return { success: true };
  };

  const deleteUserAccount = (id: string) => {
    if (userAccounts.length <= 1) {
      return { success: false, error: 'Minimal harus ada 1 User Account di sistem!' };
    }
    const newList = userAccounts.filter((u) => u.id !== id);
    setUserAccounts(newList);
    saveLocalUsers(newList);

    if (activeUser?.id === id) {
      const nextUser = newList[0] || null;
      setActiveUser(nextUser);
      saveLocalActiveUser(nextUser);
    }
    return { success: true };
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!activeUser) return false;
    if (activeUser.role === 'ADMIN' || activeUser.hakAkses.includes('ALL')) return true;
    return activeUser.hakAkses.includes(permissionKey);
  };

  // --- GOOGLE SYNC METHODS ---
  const loginWithGoogle = (): Promise<boolean> => {
    return new Promise((resolve) => {
      triggerGoogleLogin(
        async (newToken, fetchedUser) => {
          if (fetchedUser) {
            setUserInfo(fetchedUser);
            saveLocalUserInfo(fetchedUser);
          }
          const success = await connectGoogleToken(newToken);
          resolve(success);
        },
        (errorMsg) => {
          setSyncState((prev) => ({
            ...prev,
            isConnected: false,
            errorMessage: errorMsg || 'Login Google gagal.',
          }));
          resolve(false);
        }
      );
    });
  };

  const connectGoogleToken = async (newToken: string): Promise<boolean> => {
    const isOk = await testGoogleSpreadsheetConnection(settings.googleSheetId, newToken);
    if (isOk) {
      saveGoogleToken(newToken);
      setToken(newToken);

      let uInfo = userInfo;
      if (!uInfo) {
        uInfo = await fetchGoogleUserProfile(newToken);
        if (uInfo) {
          setUserInfo(uInfo);
          saveLocalUserInfo(uInfo);
        }
      }

      setSyncState({
        isConnected: true,
        sheetSynced: true,
        driveSynced: true,
        accessToken: newToken,
        userEmail: uInfo?.email || 'penggadaianaulia51@gmail.com',
        userName: uInfo?.name || 'Aulia 51',
        userPicture: uInfo?.picture,
        lastSyncTime: new Date().toLocaleTimeString('id-ID'),
      });
      await initializeGoogleSheet(settings.googleSheetId, newToken);
      return true;
    } else {
      setSyncState({
        isConnected: false,
        sheetSynced: false,
        driveSynced: false,
        errorMessage: 'Gagal menghubungkan: Token tidak valid atau Google Sheet tidak dapat diakses.',
      });
      return false;
    }
  };

  const disconnectGoogle = () => {
    removeGoogleToken();
    removeLocalUserInfo();
    setToken(null);
    setUserInfo(null);
    setSyncState({
      isConnected: false,
      sheetSynced: false,
      driveSynced: false,
      errorMessage: 'Koneksi Google terputus.',
    });
  };

  const initSheetHeaders = async (): Promise<boolean> => {
    if (!token) return false;
    return await initializeGoogleSheet(settings.googleSheetId, token);
  };

  const resetSpreadsheetData = async (): Promise<{ success: boolean; error?: string }> => {
    if (!token || !syncState.isConnected) {
      return { success: false, error: 'Tidak terhubung ke Google Sheet. Silakan login terlebih dahulu.' };
    }
    const res = await resetAndSyncSpreadsheet(
      settings.googleSheetId,
      token,
      nasabahList,
      transaksiList,
      pembayaranList
    );
    if (res.success) {
      setSyncState((prev) => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString('id-ID') }));
    }
    return res;
  };

  const syncAllDataToSheet = async () => {
    if (!token || !syncState.isConnected) return;
    try {
      await initializeGoogleSheet(settings.googleSheetId, token);

      for (const n of nasabahList) {
        await appendNasabahToSheet(n, settings.googleSheetId, token);
      }
      for (const t of transaksiList) {
        await appendTransaksiToSheet(t, settings.googleSheetId, token);
      }
      for (const p of pembayaranList) {
        await appendPembayaranToSheet(p, settings.googleSheetId, token);
      }
      setSyncState((prev) => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString('id-ID') }));
    } catch (err) {
      console.error('Error syncing all data:', err);
    }
  };

  const addNasabah = async (nasabah: Nasabah, docFile?: File) => {
    let urlDokumen = nasabah.urlDokumen || '';

    if (docFile && token && syncState.isConnected) {
      const uploadRes = await uploadFileToGoogleDrive(docFile, settings.googleDriveFolderId, token);
      if (uploadRes.success && uploadRes.fileUrl) {
        urlDokumen = uploadRes.fileUrl;
      }
    } else if (docFile && !urlDokumen) {
      urlDokumen = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(docFile);
      });
    }

    const updatedNasabah = { ...nasabah, urlDokumen };
    const newList = [updatedNasabah, ...nasabahList];
    setNasabahList(newList);
    saveLocalNasabah(newList);

    if (token && syncState.isConnected) {
      await appendNasabahToSheet(updatedNasabah, settings.googleSheetId, token);
    }

    return { success: true, urlDokumen };
  };

  const addTransaksiGadai = async (tx: TransaksiGadai) => {
    const txWithOfficer = { ...tx, petugas: activeUser?.namaLengkap || tx.petugas || 'Kasir' };
    const newList = [txWithOfficer, ...transaksiList];
    setTransaksiList(newList);
    saveLocalTransaksi(newList);

    if (token && syncState.isConnected) {
      const res = await appendTransaksiToSheet(txWithOfficer, settings.googleSheetId, token);
      if (!res) {
        return { success: false, error: 'Gagal mengirim transaksi ke Google Sheet.' };
      }
    }

    return { success: true };
  };

  const deleteTransaksiGadai = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const updatedTxs = transaksiList.filter((t) => t.id !== id);
    const updatedPem = pembayaranList.filter((p) => p.idTransaksi !== id);

    setTransaksiList(updatedTxs);
    saveLocalTransaksi(updatedTxs);

    setPembayaranList(updatedPem);
    saveLocalPembayaran(updatedPem);

    if (token && syncState.isConnected) {
      const res = await resetAndSyncSpreadsheet(
        settings.googleSheetId,
        token,
        nasabahList,
        updatedTxs,
        updatedPem
      );
      if (!res.success) {
        return { success: false, error: 'Transaksi dihapus secara lokal, tetapi gagal update ke Google Sheet: ' + (res.error || '') };
      }
    }

    return { success: true };
  };

  const processPembayaran = async (pembayaran: Pembayaran, updatedStatus: 'AKTIF' | 'LUNAS') => {
    const pemWithOfficer = { ...pembayaran, petugas: activeUser?.namaLengkap || pembayaran.petugas || 'Kasir' };
    const newPemList = [pemWithOfficer, ...pembayaranList];
    setPembayaranList(newPemList);
    saveLocalPembayaran(newPemList);

    const today = new Date().toISOString().split('T')[0];
    const updatedTxs = transaksiList.map((tx) => {
      if (tx.id === pembayaran.idTransaksi) {
        if (updatedStatus === 'LUNAS') {
          return {
            ...tx,
            status: 'LUNAS' as const,
            totalDibayar: (tx.totalDibayar || 0) + pembayaran.totalDibayar,
            tanggalSelesai: today,
          };
        } else {
          const { addDays } = require('../utils/calculator');
          const newMaturity = addDays(tx.jatuhTempo, 14);
          const newGrace = addDays(newMaturity, 14);
          return {
            ...tx,
            status: 'AKTIF' as const,
            jatuhTempo: newMaturity,
            masaTenggangHingga: newGrace,
            denda: 0,
            totalDibayar: (tx.totalDibayar || 0) + pembayaran.totalDibayar,
          };
        }
      }
      return tx;
    });

    setTransaksiList(updatedTxs);
    saveLocalTransaksi(updatedTxs);

    if (token && syncState.isConnected) {
      await appendPembayaranToSheet(pemWithOfficer, settings.googleSheetId, token);
    }

    return { success: true };
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveLocalSettings(newSettings);
  };

  const manualRefreshStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const evaluated = transaksiList.map((tx) => {
      if (tx.status === 'LUNAS' || tx.status === 'TERLELANG') return tx;
      const { status, denda } = evaluatePawnStatus(tx, today);
      return { ...tx, status, denda };
    });
    setTransaksiList(evaluated);
    saveLocalTransaksi(evaluated);
  };

  return (
    <SyncContext.Provider
      value={{
        syncState,
        nasabahList,
        transaksiList,
        pembayaranList,
        settings,
        userAccounts,
        activeUser,
        loginAppUser,
        logoutAppUser,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        hasPermission,
        loginWithGoogle,
        connectGoogleToken,
        disconnectGoogle,
        initSheetHeaders,
        resetSpreadsheetData,
        syncAllDataToSheet,
        addNasabah,
        addTransaksiGadai,
        deleteTransaksiGadai,
        processPembayaran,
        updateSettings,
        manualRefreshStatus,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
