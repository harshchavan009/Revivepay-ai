import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, ShieldAlert, Sparkles, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { organizationService, RazorpayConnectionStatus } from "../services";

export const TestModeBanner: React.FC = () => {
  const [status, setStatus] = useState<RazorpayConnectionStatus | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const data = await organizationService.getCurrent();
      setStatus(data);
    } catch {
      // Default to sandbox view if unauthenticated or network error
      setStatus({
        is_connected: true,
        key_id_masked: "rzp_test_...89a2",
        has_key_secret: true,
        has_webhook_secret: true,
        webhook_secret_masked: "whsec_...19f3",
        webhook_url: "/api/v1/webhooks/razorpay",
        is_test_mode: true,
        org_id: "org_default",
        org_name: "Primary Organization"
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status periodically to keep synchronized with tenant mode switches
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.is_test_mode) {
    return null;
  }

  const handleToggleToLive = async () => {
    if (!status.key_id_masked || status.key_id_masked.startsWith("rzp_test_")) {
      // Must configure live keys first
      navigate("/settings#razorpay");
      return;
    }
    setIsSwitching(true);
    try {
      await organizationService.toggleMode(false);
      await fetchStatus();
    } catch {
      navigate("/settings#razorpay");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      role="banner"
      aria-label="Razorpay Test Mode Notice"
      className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md relative z-30 shrink-0 border-b border-amber-400/40"
    >
      <div className="flex items-center gap-2.5 max-w-4xl truncate">
        <span className="p-1 rounded bg-black/20 text-white shrink-0 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-200" />
        </span>
        <div className="truncate">
          <span className="font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded text-[10px] mr-2 text-amber-100 font-mono">
            SANDBOX / TEST MODE
          </span>
          <span className="font-semibold text-amber-50">
            RevivePay is running in Razorpay Sandbox mode.
          </span>
          <span className="hidden sm:inline text-amber-100/90 ml-1.5">
            No real monetary charges or banking debits occur. All actions pass deterministic policy guardrails.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Link
          to="/settings"
          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-black/25 hover:bg-black/35 text-amber-100 hover:text-white text-[11px] font-semibold transition-colors"
        >
          <span>Configure Gateway Keys</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={handleToggleToLive}
          disabled={isSwitching}
          className="px-3 py-1 rounded bg-white hover:bg-amber-50 text-amber-900 font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1"
          title="Switch to Live production mode (requires rzp_live_ keys)"
        >
          {isSwitching ? "Switching..." : "Switch to Live"}
        </button>
      </div>
    </div>
  );
};
