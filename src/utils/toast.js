import { toast } from "sonner";

// Global toast utility
export const globalToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast.info(message),
  warning: (message) => toast.warning(message),
};

// Make it available globally for the API slice
if (typeof window !== "undefined") {
  window.globalToast = globalToast;
}
