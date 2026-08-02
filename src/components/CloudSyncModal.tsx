import React, { useState } from 'react';
import { Cloud, RefreshCw, UploadCloud, DownloadCloud, Copy, Check, FileText, Smartphone, Laptop, AlertCircle, X } from 'lucide-react';
import { AppStateData } from '../types';
import { pushToCloudVault, pullFromCloudVault, exportDataAsJSON } from '../lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppStateData;
  onStateSynced: (newState: AppStateData) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  appState,
  onStateSynced,
}) => {
  const [vaultKey, setVaultKey] = useState<string>(appState.settings.syncVaultKey || 'STEM-78A9B2');
  const [copied, setCopied] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(vaultKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushToCloud = async () => {
    setIsLoading(true);
    setSyncStatusMsg({ type: 'info', text: 'Pushing local study sessions & planner tasks to Cloud Vault...' });

    const res = await pushToCloudVault(vaultKey, appState);
    setIsLoading(false);

    if (res.success) {
      setSyncStatusMsg({
        type: 'success',
        text: `✓ Cloud Vault updated successfully at ${new Date().toLocaleTimeString()}! Use Sync Key "${vaultKey.trim().toUpperCase()}" on your other devices to pull.`,
      });
      // Update last synced time in settings
      onStateSynced({
        ...appState,
        settings: {
          ...appState.settings,
          syncVaultKey: vaultKey.trim().toUpperCase(),
          lastSyncedAt: new Date().toISOString(),
        },
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Failed to push to Cloud Vault. Check network connection.',
      });
    }
  };

  const handlePullFromCloud = async () => {
    setIsLoading(true);
    setSyncStatusMsg({ type: 'info', text: 'Fetching synced data from Cloud Vault...' });

    const res = await pullFromCloudVault(vaultKey);
    setIsLoading(false);

    if (res.success && res.data) {
      onStateSynced(res.data);
      setSyncStatusMsg({
        type: 'success',
        text: `✓ Successfully synced latest study data from Cloud Vault! Updated tasks & session logs.`,
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Sync Vault not found. Make sure you push from your primary device first.',
      });
    }
  };

  // JSON File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.sessions)) {
          onStateSynced(parsed);
          setSyncStatusMsg({ type: 'success', text: '✓ Backup JSON imported successfully!' });
        } else {
          setSyncStatusMsg({ type: 'error', text: 'Invalid JSON file format. Must be a STEM Study Backup file.' });
        }
      } catch (err) {
        setSyncStatusMsg({ type: 'error', text: 'Error reading JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="serif text-base font-bold text-white">Cloud Synchronization</h3>
              <p className="text-xs text-zinc-400">Sync Physics, Chemistry, and Math study logs across devices</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#09090b] hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Vault Key Box */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Device Sync Vault Key:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={vaultKey}
              onChange={(e) => setVaultKey(e.target.value.toUpperCase())}
              placeholder="e.g. STEM-78A9B2"
              className="flex-1 bg-[#09090b] border border-[#27272a] text-amber-400 text-sm font-mono font-bold rounded-lg px-3 py-2.5 tracking-wider focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              onClick={handleCopyKey}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Enter this exact key on your phone, tablet, or secondary laptop to pair your study sessions.
          </p>
        </div>

        {/* Push & Pull Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePushToCloud}
            disabled={isLoading}
            className="py-2.5 px-4 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Push Local Data
          </button>

          <button
            onClick={handlePullFromCloud}
            disabled={isLoading}
            className="py-2.5 px-4 bg-[#09090b] border border-[#27272a] hover:border-zinc-500 disabled:opacity-50 text-zinc-200 font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-all"
          >
            <DownloadCloud className="w-4 h-4" />
            Pull Cloud Data
          </button>
        </div>

        {/* Status Message Alert */}
        {syncStatusMsg && (
          <div
            className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
              syncStatusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : syncStatusMsg.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                : 'bg-[#09090b] border-[#27272a] text-zinc-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{syncStatusMsg.text}</span>
          </div>
        )}

        {/* Instructions Graphic */}
        <div className="bg-[#09090b] p-4 rounded-xl border border-[#27272a] space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">How Device Pairing Works:</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2 bg-[#121214] p-2.5 rounded-lg border border-[#27272a]">
              <Laptop className="w-4 h-4 text-amber-500 shrink-0" />
              <span>1. Push study sessions on Laptop</span>
            </div>
            <div className="flex items-center gap-2 bg-[#121214] p-2.5 rounded-lg border border-[#27272a]">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>2. Enter same key & Pull on Phone</span>
            </div>
          </div>
        </div>

        {/* JSON Backup Export & Import */}
        <div className="pt-3 border-t border-[#27272a] flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => exportDataAsJSON(appState)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium transition-all"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            Export JSON File
          </button>

          <label className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium cursor-pointer transition-all">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            Import Backup File
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

      </div>
    </div>
  );
};
