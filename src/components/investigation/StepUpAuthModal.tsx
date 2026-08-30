import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Lock, X, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { authService } from "../../services";
import { formatINR } from "../../data/mockData";

interface StepUpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  amount: number;
  customerName?: string;
  onSuccess: (stepUpToken: string) => void;
}

export const StepUpAuthModal: React.FC<StepUpAuthModalProps> = ({
  isOpen,
  onClose,
  caseId,
  amount,
  customerName = "Enterprise Customer",
  onSuccess,
}) => {
  const [credential, setCredential] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError("Please enter your 6-digit MFA security OTP code or operator password.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const res = await authService.stepUpVerify(caseId, credential.trim());
      if (res.success && res.step_up_token) {
        onSuccess(res.step_up_token);
      } else {
        setError(res.message || "Step-up re-authentication failed.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP code or password.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAutofillTestOtp = () => {
    setCredential("782910");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-2xl shadow-premium-lg overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Step-Up Re-Authentication</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/30">
                  HIGH-VALUE GATE
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono mt-0.5">
                Case: {caseId} • Value: {formatINR(amount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Policy Context Alert */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Enterprise Governance Threshold Triggered</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Transaction amount <strong className="text-[var(--color-text-primary)] font-mono">{formatINR(amount)}</strong> for {customerName} exceeds the standard autonomous limit (₹50,000). Enter your operator credentials or MFA OTP code to sign this recovery action.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  6-Digit MFA Security Code / Password:
                </label>
                <button
                  type="button"
                  onClick={handleAutofillTestOtp}
                  className="text-[11px] font-mono text-[var(--color-accent)] hover:underline cursor-pointer font-bold"
                >
                  Autofill Sandbox OTP (782910)
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Enter 6-digit OTP code or password..."
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  autoFocus
                  className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--color-accent)] font-mono tracking-wider"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Sandbox Mode: Use <code className="font-mono text-[var(--color-accent)]">782910</code> or your persona account password.
              </p>
            </div>

            {/* Audit Log Security Notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Verification will be cryptographically hashed and logged to the immutable ledger as <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">recovery.approval.stepup_verified</code>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] text-xs font-semibold border border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isVerifying ? "Verifying..." : "Verify & Authorize Action"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
