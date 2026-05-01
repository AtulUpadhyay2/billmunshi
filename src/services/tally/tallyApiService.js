import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';

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
