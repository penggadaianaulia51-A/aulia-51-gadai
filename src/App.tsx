import React, { useState } from 'react';
import { SyncProvider, useSync } from './context/SyncContext';
import { Header, ActiveTab } from './components/Header';
import { WarningBanner } from './components/WarningBanner';
import { DashboardView } from './views/DashboardView';
import { InputNasabahView } from './views/InputNasabahView';
import { GadaiBaruView } from './views/GadaiBaruView';
import { PerpanjangView } from './views/PerpanjangView';
import { PelunasanView } from './views/PelunasanView';
import { BarangJaminanView } from './views/BarangJaminanView';
import { LaporanView } from './views/LaporanView';
import { CetakUlangNotaView } from './views/CetakUlangNotaView';
import { PengaturanView } from './views/PengaturanView';

import { ShieldAlert } from 'lucide-react';

function MainAppContent() {
  const { syncState, hasPermission } = useSync();
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [selectedNasabahForGadai, setSelectedNasabahForGadai] = useState<string | undefined>(undefined);

  const isConnected = syncState.isConnected;

  const handleNavigateToGadaiWithNasabah = (nasabahId: string) => {
    setSelectedNasabahForGadai(nasabahId);
    setActiveTab('GADAI_BARU');
  };

  const isTabAllowed = hasPermission(activeTab);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 flex flex-col md:flex-row ${
        isConnected ? 'bg-slate-50 text-slate-900' : 'bg-red-50/60 text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sync & Warning Banner */}
        <WarningBanner />

        {/* View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6">
          {!isTabAllowed ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-lg">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Akses Menu Dibatasi</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Akun Anda tidak memiliki hak akses otorisasi untuk membuka menu <b>{activeTab}</b>. Hubungi Administrator untuk meminta hak akses.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow"
              >
                Kembali ke Dashboard
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'DASHBOARD' && (
                <DashboardView
                  setActiveTab={setActiveTab}
                  onSelectNasabahForGadai={handleNavigateToGadaiWithNasabah}
                />
              )}

              {activeTab === 'INPUT_NASABAH' && (
                <InputNasabahView onSuccessNavigateToGadai={handleNavigateToGadaiWithNasabah} />
              )}

              {activeTab === 'GADAI_BARU' && (
                <GadaiBaruView
                  preSelectedNasabahId={selectedNasabahForGadai}
                  onBackToDashboard={() => {
                    setSelectedNasabahForGadai(undefined);
                    setActiveTab('DASHBOARD');
                  }}
                />
              )}

              {activeTab === 'PERPANJANG' && (
                <PerpanjangView onBackToDashboard={() => setActiveTab('DASHBOARD')} />
              )}

              {activeTab === 'PELUNASAN' && (
                <PelunasanView onBackToDashboard={() => setActiveTab('DASHBOARD')} />
              )}

              {activeTab === 'BARANG_JAMINAN' && (
                <BarangJaminanView setActiveTab={setActiveTab} />
              )}

              {activeTab === 'LAPORAN' && <LaporanView />}

              {activeTab === 'CETAK_ULANG' && (
                <CetakUlangNotaView onBackToDashboard={() => setActiveTab('DASHBOARD')} />
              )}

              {activeTab === 'PENGATURAN' && <PengaturanView />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-auto py-6 text-center text-xs text-gray-500 print:hidden">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-bold text-gray-700">AULIA 51 GADAI — Sistem Manajemen Penggadaian Terintegrasi</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Google Spreadsheet: <code>1XCK7FPFOn954Uv9DDMDR86bUvivTZBj8_gwCGtWB-aA</code> | Google Drive: <code>1eHS4ciGArpVXE429Nom6YI4aY0Wk2HlG</code>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SyncProvider>
      <MainAppContent />
    </SyncProvider>
  );
}
