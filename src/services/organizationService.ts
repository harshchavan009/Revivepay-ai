import { apiClient } from "./index";

export interface RazorpayConnectionStatus {
  is_connected: boolean;
  key_id_masked: string | null;
  has_key_secret: boolean;
  has_webhook_secret: boolean;
  webhook_secret_masked: string | null;
  webhook_url: string;
  is_test_mode: boolean;
  org_id: string;
  org_name: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  description: string;
}

export interface OnboardingStatus {
  org_id: string;
  org_name: string;
  is_test_mode: boolean;
  progress_percentage: number;
  completed_steps: number;
  total_steps: number;
  steps: OnboardingStep[];
}

export const organizationService = {
  getCurrent: async (): Promise<RazorpayConnectionStatus> => {
    const res = await apiClient.get("/organization/current");
    return res.data;
  },

  connectRazorpay: async (data: {
    key_id: string;
    key_secret: string;
    webhook_secret?: string;
  }): Promise<RazorpayConnectionStatus> => {
    const res = await apiClient.post("/organization/razorpay/connect", data);
    return res.data;
  },

  disconnectRazorpay: async (): Promise<RazorpayConnectionStatus> => {
    const res = await apiClient.post("/organization/razorpay/disconnect");
    return res.data;
  },

  toggleMode: async (
    is_test_mode: boolean
  ): Promise<{ is_test_mode: boolean; mode_label: string; banner_message: string }> => {
    const res = await apiClient.post("/organization/mode/toggle", { is_test_mode });
    return res.data;
  },

  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const res = await apiClient.get("/organization/onboarding-status");
    return res.data;
  }
};
