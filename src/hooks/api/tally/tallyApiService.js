import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';

// ===========================
// TALLY CONFIGS
// ===========================

/**
 * Get all Tally configurations for an organization
 */
export const useGetTallyConfigs = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ['tallyConfigs', organizationId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/configs/`, {
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
 * Create a new Tally configuration
 */
export const useCreateTallyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...newConfig }) => {
      const response = await apiFetch(`tally/org/${organizationId}/configs/`, {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the configs list to refetch
      queryClient.invalidateQueries({ queryKey: ['tallyConfigs', variables.organizationId] });
    },
  });
};

/**
 * Update an existing Tally configuration
 */
export const useUpdateTallyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id, ...patch }) => {
      const response = await apiFetch(`tally/org/${organizationId}/configs/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the configs list to refetch
      queryClient.invalidateQueries({ queryKey: ['tallyConfigs', variables.organizationId] });
    },
  });
};

/**
 * Delete a Tally configuration
 */
export const useDeleteTallyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id }) => {
      const response = await apiFetch(`tally/org/${organizationId}/configs/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the configs list to refetch
      queryClient.invalidateQueries({ queryKey: ['tallyConfigs', variables.organizationId] });
    },
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
