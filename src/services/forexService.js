import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Exchange rates, and the rate frozen onto one bill.
 *
 * The rate table is organisation-wide and identical for every voucher
 * type, so it is cached once per organisation here rather than refetched
 * by each detail page. The server caches it again in Redis; the provider
 * is not called per bill at either layer.
 *
 * Two rate sets come back in one response and they answer different
 * questions:
 *
 *   `rates`  a market mid-rate. Indicative. Fine for management
 *            reporting and for checking a document looks sane.
 *   `cbic`   the rate notified by CBIC under section 14 of the Customs
 *            Act, with separate `import` and `export` columns and the
 *            notification number it was published under. This is the
 *            figure customs valuation and GST on imports require.
 *
 * They disagree, and the gap is not noise: under notification 29/2026
 * USD is notified at 95.90 for imports and 94.20 for exports against a
 * market mid near 95.04. Nothing here is allowed to reconcile them. The
 * operator picks, and the choice is stored.
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
 * `exchangeRate` wins over everything and is recorded as `manual`, so a
 * typed figure is never later mistaken for a fetched one. Otherwise
 * `rateSource` decides:
 *
 *   "cbic_import" / "cbic_export"  the notified rate off that column,
 *                                  stored with its notification number
 *   "cbic"                         the notified rate off whichever
 *                                  column the voucher type implies
 *   "market" or omitted            the market mid-rate, as before
 *
 * The screen always sends an explicit side rather than plain "cbic":
 * the operator saw both columns and chose one, and the stored source
 * should say so rather than record a server-side inference.
 */
export const useSetBillCurrency = (organizationId, billId, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currency, exchangeRate, rateSource }) =>
      apiFetch(`org/${organizationId}/forex/bills/${billId}/currency/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          ...(exchangeRate ? { exchange_rate: String(exchangeRate) } : {}),
          ...(rateSource ? { rate_source: rateSource } : {}),
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
