import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { apiFetch } from '@/utils/apiClient';

// ===========================
// TALLY CONFIGS
// ===========================

/**
 * Get Tally configuration for an organization (single endpoint)
 */
export const useGetTallyConfig = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyConfig', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/config/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Create or update Tally configuration (single endpoint handles both)
 */
export const useCreateOrUpdateTallyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...configData }) => {
      const response = await apiFetch(`tally/org/${organizationId}/config/save/`, {
        method: 'POST',
        body: JSON.stringify(configData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the config query to refetch
      queryClient.invalidateQueries({ queryKey: ['tallyConfig', variables.organizationId] });
    },
  });
};

// ===========================
// BILL IMAGE SCANNER (server-side OpenCV)
// ===========================

/**
 * Send a bill image to the server for CamScanner-style enhancement.
 *
 * The same backend helper (apps/common/image_enhancement.py) is mounted under
 * both /tally/.../scan/process/ and /zoho/.../scan/process/, so we pick the
 * correct URL based on `module` ("tally" by default).
 *
 * Args:
 *   organizationId
 *   module:   "tally" | "zoho"           — default "tally"
 *   image:    File   — raw image picked by the operator
 *   corners?: [{x,y}, ...4]  — optional, in working-resolution coords from
 *                              a previous response. If omitted, server
 *                              auto-detects.
 *   filter?:  "bw" | "grayscale" | "original"  — default "bw"
 *
 * Returns:
 *   { success, enhanced_b64, corners: [{x,y}, ...], image_size: {width,height} }
 */
export const useProcessBillScan = () => {
  return useMutation({
    mutationFn: async ({
      organizationId,
      module = "tally",
      image,
      corners,
      filter,
    }) => {
      const formData = new FormData();
      formData.append("image", image);
      if (corners && corners.length === 4) {
        formData.append("corners", JSON.stringify(corners));
      }
      if (filter) {
        formData.append("filter", filter);
      }
      const base = module === "zoho" ? "zoho" : "tally";
      const response = await apiClient.post(
        `${base}/org/${organizationId}/scan/process/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    },
  });
};

// ===========================
// GST RATE → LEDGER MAPPINGS
// ===========================

/**
 * Get per-org GST rate → CGST/SGST/IGST ledger mappings.
 * Used for line-item level tax assignment on mixed-rate vendor bills.
 */
export const useGetGstRateLedgerMappings = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['gstRateLedgerMappings', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/config/gst-rate-mappings/`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Bulk upsert GST rate → ledger mappings.
 * Body shape: { mappings: [{ rate, cgst_ledger, sgst_ledger, igst_ledger }, ...] }
 */
export const useUpsertGstRateLedgerMappings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, mappings }) => {
      const response = await apiFetch(
        `tally/org/${organizationId}/config/gst-rate-mappings/save/`,
        {
          method: 'POST',
          body: JSON.stringify({ mappings }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gstRateLedgerMappings', variables.organizationId],
      });
    },
  });
};

/**
 * Delete a single GST rate → ledger mapping by id.
 */
export const useDeleteGstRateLedgerMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, mappingId }) => {
      const response = await apiFetch(
        `tally/org/${organizationId}/config/gst-rate-mappings/${mappingId}/delete/`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gstRateLedgerMappings', variables.organizationId],
      });
    },
  });
};

/**
 * Get all Parent Ledgers for an organization (for form options)
 */
export const useGetParentLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['parentLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/parent-ledgers/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

// ===========================
// TALLY LEDGERS
// ===========================

/**
 * Get all Tally ledgers for an organization
 */
export const useGetTallyLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/ledgers/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally vendor ledgers for an organization
 */
export const useGetTallyVendorLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyVendorLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=vendor_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally tax ledgers for an organization
 */
export const useGetTallyTaxLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyTaxLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=chart_of_accounts_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally expense chart of accounts ledgers for an organization
 */
export const useGetTallyExpenseChartOfAccountsLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyExpenseChartOfAccountsLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=chart_of_accounts_expense_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally purchase ledgers for an organization
 */
export const useGetTallyPurchaseLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyPurchaseLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=chart_of_accounts_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally CGST ledgers for an organization
 */
export const useGetTallyCgstLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyCgstLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=cgst_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally SGST ledgers for an organization
 */
export const useGetTallySgstLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallySgstLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=sgst_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get Tally IGST ledgers for an organization
 */
export const useGetTallyIgstLedgers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyIgstLedgers', organizationId],
    queryFn: async () => {
      const response = await apiFetch(
        `tally/org/${organizationId}/configs/ledgers/?parent_type=igst_parents`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get all Tally masters for an organization
 */
export const useGetTallyMasters = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyMasters', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/masters/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get help data for an organization
 */
export const useGetHelpData = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyHelp', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/help/`, {
        method: 'GET',
      });
      return response;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Poll the Tally TCP bridge health status. Returns whether the last
 * ping from the connector arrived within the server-side threshold
 * (currently 15 min = 10 min interval + 5 min grace). Refetched
 * automatically so the Account Info badge reflects reality without
 * a page reload.
 *
 * Response shape:
 *   { connected: boolean, last_ping_at: string|null,
 *     seconds_since_ping: number|null, threshold_seconds: number,
 *     ping_interval_seconds: number, message: string }
 */
export const useGetTallyHealthStatus = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyHealth', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/health/`, {
        method: 'GET',
      });
      return response;
    },
    enabled: !!organizationId,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 30 * 1000,
    ...options,
  });
};

/**
 * Get the admin-managed Tally setup guide steps.
 * Returns: { steps: [{ id, step_number, title, description, image_url, image_alt, order }] }
 */
export const useGetTallySetupGuide = (options = {}) => {
  return useQuery({
    queryKey: ['tallySetupGuide'],
    queryFn: async () => {
      const response = await apiFetch(`tally/setup-guide/`, {
        method: 'GET',
      });
      return response;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};
