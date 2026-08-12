import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';

// ===========================
// SUPPORT TICKETS
// ===========================
// Base URL pattern mirrors frontend/src/services/tally/*.js — all requests
// go through apiFetch (axios instance with the auth token attached via the
// request interceptor, see @/utils/apiClient.js).

/**
 * Create a new support ticket.
 * POST /api/v1/support/tickets/
 *
 * payload: { subject, category, message, priority?, page_url?, browser? }
 */
export const useCreateSupportTicket = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch('support/tickets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });
      return response;
    },
    // `...options` has to come BEFORE `onSuccess`, not after. Spread last, a
    // caller-supplied `onSuccess` replaced this one wholesale and the cache
    // invalidation below never ran.
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
      options.onSuccess?.(...args);
    },
  });
};

/**
 * List the current user's support tickets.
 * GET /api/v1/support/tickets/mine/
 */
export const useMySupportTickets = (options = {}) => {
  return useQuery({
    queryKey: ['mySupportTickets'],
    queryFn: async () => {
      const response = await apiFetch('support/tickets/mine/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response?.data || [];
    },
    ...options,
  });
};

/**
 * Reply to an existing support ticket.
 * POST /api/v1/support/tickets/{id}/reply/
 *
 * payload: { ticketId, body, is_internal? }
 */
export const useReplyToTicket = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body, is_internal }) => {
      const response = await apiFetch(`support/tickets/${ticketId}/reply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { body, is_internal },
      });
      return response;
    },
    // Spread first — see the note in useCreateSupportTicket. This is the hook
    // that actually hit the bug: TicketReplyForm passes its own onSuccess to
    // clear the textarea, which silently cancelled the refetch, so a sent
    // reply didn't appear in the thread until a manual reload.
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
      options.onSuccess?.(...args);
    },
  });
};
