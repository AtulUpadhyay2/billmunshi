import { toast } from "sonner";

// Global toast utility
// `options` is optional and passed straight to sonner (duration, description…).
export const globalToast = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
};

// Make it available globally for the API slice
if (typeof window !== "undefined") {
  window.globalToast = globalToast;
}
