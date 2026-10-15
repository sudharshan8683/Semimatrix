import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Shield,
  Key,
  Database,
  Trash2,
  Lock,
  User,
  Building,
  AlertOctagon,
  CheckCircle2,
  Fingerprint
} from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user, deleteWorkspaceData, isLoading } = useAuthStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    const success = await deleteWorkspaceData();
    if (!success) {
      setStatusMsg('Failed to delete workspace data. Only workspace owners can execute deletion.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans text-xs">
      {/* Title */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Workspace & Security
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
          Operator profile, credentials, and workspace lifecycle settings.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
          {statusMsg}
        </div>
      )}

      {/* Operator Profile Card */}
      <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-navy-700/80">
          <User size={16} className="text-navy-700 dark:text-amber-400" />
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
            Operator Profile & Access Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">OPERATOR NAME</span>
            <span className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">
              {user?.fullName || 'Cleanroom Engineer'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">AUTHENTICATED EMAIL</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 text-xs mt-0.5 block font-semibold truncate">
              {user?.email || 'engineer@semimatrix.local'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">FAB PRIVILEGE ROLE</span>
            <span className="font-bold uppercase text-navy-800 dark:text-amber-400 text-sm mt-0.5 block">
              {user?.role || 'owner'}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Isolation Card */}
      <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-navy-700/80">
          <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
            Cryptographic Multi-Tenant Isolation
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
              UNIQUE WORKSPACE TENANT IDENTIFIER
            </span>
            <span className="font-mono font-bold text-navy-800 dark:text-amber-400 text-sm break-all">
              {user?.workspaceId || 'workspace_demo_primary'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Derived exclusively from cryptographic JWT session tokens. URL query parameter alteration cannot breach cross-tenant cleanroom boundaries.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Session tokens: 15-minute rotation</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Refresh tokens: 7-day httpOnly cookies</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Password hashing: Argon2 / Bcrypt</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Formula injection sanitization active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Workspace Data (Owner Only) */}
      <div className="bg-white dark:bg-navy-900/60 border border-rose-200 dark:border-rose-900/60 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400">
          <AlertOctagon size={16} />
          <h2 className="font-display font-bold text-sm">
            Danger Zone: Delete Workspace Telemetry & Derived Records
          </h2>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          Permanently removes all uploaded datasets, equipment histories, telemetry readings, wafer lot progressions, alerts, investigations, and exported reports associated with your workspace ID. This action cannot be reversed.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 size={13} />
            <span>Initiate Workspace Deletion</span>
          </button>
        ) : (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg space-y-3">
            <span className="font-bold text-rose-900 dark:text-rose-300 block">
              Confirm Complete Data Erasure
            </span>
            <p className="text-[11px] text-rose-800 dark:text-rose-400">
              Type <strong className="font-bold font-mono">DELETE</strong> below to execute immediate cryptographic deletion of this workspace:
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-navy-950 border border-rose-300 dark:border-rose-800 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none w-44"
              />
              <button
                onClick={handleDelete}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors disabled:opacity-40"
              >
                {deleting ? 'Erasing Workspace...' : 'Confirm Permanent Erasure'}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteInput('');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
