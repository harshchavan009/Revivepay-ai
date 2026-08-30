import { recoveryService, auditService } from "./index";

export interface OperationalNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "approval" | "success" | "warning" | "info";
  link: string;
  read?: boolean;
}

const DEFAULT_NOTIFICATIONS: OperationalNotification[] = [
  {
    id: "notif-1",
    title: "High-Value Approval Required",
    message: "Case RV-10291 (₹4,999.00) requires human sign-off per merchant policy threshold.",
    time: "5m ago",
    type: "approval",
    link: "/approvals",
    read: false
  },
  {
    id: "notif-2",
    title: "Autonomous Recovery Successful",
    message: "Successfully recovered ₹8,885.19 for Chiara Deshmukh via automated 1-click retry.",
    time: "24m ago",
    type: "success",
    link: "/cases/RV-10293",
    read: false
  },
  {
    id: "notif-3",
    title: "HMAC Webhook Ingested",
    message: "Razorpay webhook event 'payment.failed' verified with valid SHA256 signature.",
    time: "1h ago",
    type: "info",
    link: "/audit",
    read: true
  },
  {
    id: "notif-4",
    title: "Retry Limit Exhausted & Escalated",
    message: "Case RV-10294 reached maximum retries (2/2) and was safely escalated to merchant.",
    time: "2h ago",
    type: "warning",
    link: "/cases/RV-10294",
    read: true
  }
];

let cachedNotifications: OperationalNotification[] = [...DEFAULT_NOTIFICATIONS];
let listeners: Array<(notifications: OperationalNotification[]) => void> = [];

export const notificationService = {
  getNotifications: async (): Promise<OperationalNotification[]> => {
    try {
      const pendingCases = await recoveryService.getCases({ approval_status: "PENDING" });
      if (pendingCases && pendingCases.length > 0) {
        const approvalNotifs: OperationalNotification[] = pendingCases.slice(0, 3).map((c, idx) => ({
          id: `approval-${c.case_id || idx}`,
          title: "Policy Gate Approval Required",
          message: `Case ${c.case_id} (${c.customer_name}) at risk for ₹${(c.amount ?? c.amount_at_risk ?? 0).toLocaleString("en-IN")}.`,
          time: "Just now",
          type: "approval" as const,
          link: "/approvals",
          read: false
        }));

        // Merge without duplicates
        const existingIds = new Set(approvalNotifs.map(n => n.id));
        cachedNotifications = [
          ...approvalNotifs,
          ...cachedNotifications.filter(n => !existingIds.has(n.id) && !n.id.startsWith("approval-"))
        ];
      }
    } catch {
      // Return cached
    }
    return cachedNotifications;
  },

  markAsRead: (id: string) => {
    cachedNotifications = cachedNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    listeners.forEach(fn => fn(cachedNotifications));
  },

  markAllAsRead: () => {
    cachedNotifications = cachedNotifications.map(n => ({ ...n, read: true }));
    listeners.forEach(fn => fn(cachedNotifications));
  },

  subscribe: (listener: (notifications: OperationalNotification[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};
