import { toast } from 'react-toastify';

// Global toast utility
export const globalToast = {
  success: (message) => {
    if (typeof toast !== 'undefined') {
      toast.success(message);
    }
  },
  error: (message) => {
    if (typeof toast !== 'undefined') {
      toast.error(message);
    }
  },
  info: (message) => {
    if (typeof toast !== 'undefined') {
      toast.info(message);
    }
  },
  warning: (message) => {
    if (typeof toast !== 'undefined') {
      toast.warning(message);
    }
  }
};

// Make it available globally for the API slice
if (typeof window !== 'undefined') {
  window.globalToast = globalToast;
}
