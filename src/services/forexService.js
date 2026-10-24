import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Exchange rates, and the rate frozen onto one bill.
 *
 * The rate table is organisation-wide and identical for every voucher
 * type, so it is cached once per organisation here rather than refetched
 * by each detail page. The server caches it again in Redis; the provider
 * is not called per bill at either layer.
 */

export const useForexRates = (organizationId, options = {}) =>
  useQuery({
    queryKey: ["forexRates", organizationId],
    queryFn: () =>
      apiFetch(`org/${organizationId}/forex/rates/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    enabled: Boolean(organizationId),
    // Rates move once a day. Refetching on every page focus would spend
    // requests to redisplay the same number.
    staleTime: 60 * 60 * 1000,
    ...options,
  });

/**
 * Set a bill's currency and freeze the rate it will be posted at.
 *
 * Omit `exchangeRate` to take the server's current rate; pass one to
 * override it by hand, which the server records as `manual` so a typed
 * figure is never later mistaken for a fetched one.
 */
export const useSetBillCurrency = (organizationId, billId, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currency, exchangeRate }) =>
      apiFetch(`org/${organizationId}/forex/bills/${billId}/currency/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          ...(exchangeRate ? { exchange_rate: String(exchangeRate) } : {}),
        }),
      }),
    onSuccess: (...args) => {
      // The bill's own query holds the currency too, and the activity
      // log just gained an entry.
      queryClient.invalidateQueries({ queryKey: ["billActivity", organizationId, billId] });
      options.onSuccess?.(...args);
    },
    ...options,
  });
};
