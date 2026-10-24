import { useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import {
  fetchZohoTrashPage,
  restoreZohoTrashItem,
  deleteZohoTrashItemForever,
  emptyZohoTrash,
  ZOHO_TRASH_TYPE_TABS,
} from '@/services/zoho/zohoTrashService';
import { TRASH_TYPE_TABS as TALLY_TRASH_TYPE_TABS } from '@/services/tally/tallyTrashService';

/**
 * One Trash screen over two modules.
 *
 * Tally and Zoho each own their own trash registry and their own four
 * endpoints (apps/module/tally/trash.py and apps/module/zoho/trash.py).
 * The screen merges them, which
 * raises one problem the Approvals queue hit first: both modules use the
 * slug `purchase-voucher`, so a row's type alone does not say which
 * table it came from. Every row therefore carries `module`, every key is
 * `module:slug`, and every mutation dispatches on `row.module`.
 *
 * Both endpoints now send `module` and `module_label`. The stamping
 * below is a fallback, kept because the hardcoded tab constants used
 * when a module's request fails carry no module of their own.
 *
 * Merging two independently paginated feeds cannot be done page by page,
 * so the hook pulls both in full and the screen paginates in memory. The
 * trash is bounded by the retention window, so "in full" is small; PAGE
 * caps it anyway at MAX_PAGES x 100 rows per module so a pathological
 * org cannot hang the tab.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export const MODULES = [
  { key: 'tally', label: 'Tally' },
  { key: 'zoho', label: 'Zoho' },
];

/** Compound key: the slug alone collides across modules. */
export const rowKey = (row) => `${row.module}:${row.type}`;

const fetchTallyTrashPage = ({ organizationId, search, page, pageSize }) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page && page > 1) params.set('page', String(page));
  if (pageSize) params.set('page_size', String(pageSize));
  const query = params.toString();
  return apiFetch(
    `tally/org/${organizationId}/trash/${query ? `?${query}` : ''}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
  );
};

/** Walk a module's pages until `next` runs out (or the cap is hit). */
const fetchAll = async (fetchPage, args) => {
  const rows = [];
  let first = null;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetchPage({ ...args, page, pageSize: PAGE_SIZE });
    if (!first) first = res;
    rows.push(...(res?.results || []));
    if (!res?.next) break;
  }
  return { rows, meta: first || {} };
};

/**
 * A module that errors must not take the whole screen down with it — a
 * Zoho outage should still let someone restore a Tally bill. The failure
 * is returned alongside the rows so the page can say so.
 */
const settle = async (module, promise) => {
  try {
    return { module, ...(await promise), error: null };
  } catch (error) {
    return { module, rows: [], meta: {}, error };
  }
};

export const useUnifiedTrash = (
  { organizationId, search } = {},
  options = {},
) => {
  const query = useQuery({
    queryKey: ['unifiedTrash', organizationId, search || ''],
    queryFn: async () => {
      const [tally, zoho] = await Promise.all([
        settle('tally', fetchAll(fetchTallyTrashPage, { organizationId, search })),
        settle('zoho', fetchAll(fetchZohoTrashPage, { organizationId, search })),
      ]);

      const stamp = (module, label) => (row) => ({
        ...row,
        module: row.module || module,
        module_label: row.module_label || label,
      });

      const rows = [
        ...tally.rows.map(stamp('tally', 'Tally')),
        ...zoho.rows.map(stamp('zoho', 'Zoho')),
      ];

      // Newest deletion first across both modules. Rows with no
      // deleted_at (trashed by an older code path) sort last rather than
      // breaking the comparison.
      rows.sort((a, b) => {
        const av = a.deleted_at ? Date.parse(a.deleted_at) : -Infinity;
        const bv = b.deleted_at ? Date.parse(b.deleted_at) : -Infinity;
        return bv - av;
      });

      const types = [
        ...(tally.meta.types?.length ? tally.meta.types : TALLY_TRASH_TYPE_TABS)
          .map((t) => ({ ...t, module: 'tally', module_label: 'Tally' })),
        ...(zoho.meta.types?.length ? zoho.meta.types : ZOHO_TRASH_TYPE_TABS)
          .map((t) => ({ ...t, module: 'zoho', module_label: 'Zoho' })),
      ];

      const countsByKey = {};
      rows.forEach((row) => {
        const k = rowKey(row);
        countsByKey[k] = (countsByKey[k] || 0) + 1;
      });

      return {
        rows,
        types,
        countsByKey,
        countsByModule: {
          tally: tally.rows.length,
          zoho: zoho.rows.length,
        },
        retentionDays:
          tally.meta.retention_days ?? zoho.meta.retention_days ?? 30,
        // Only surfaced when a module failed outright; a module that
        // simply has nothing in its trash reports no error.
        moduleErrors: [tally, zoho].filter((m) => m.error),
      };
    },
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    ...options,
  });

  return query;
};

/**
 * Restore / purge / empty, dispatched on the row's module.
 *
 * Deliberately plain async functions rather than useMutation: the screen
 * already tracks its own in-flight set per row, and a mutation hook per
 * module per action would be six hooks to keep in step.
 */
export const useTrashActions = (organizationId) => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTrash', organizationId] });
      // Every bill list and dashboard that a restore or purge changes.
      [
        'tallyVendorBills', 'tallyExpenseBills', 'tallyPaymentVouchers',
        'tallySalesBills', 'tallyReceiptBills',
        'zohoVendorBills', 'zohoExpenseBills', 'zohoJournalBills',
        'zohoSalesBills', 'zohoReceiptBills', 'zohoPaymentBills',
        'tallyOverview', 'tallyFunnel', 'tallyUsage',
        'zohoOverview', 'zohoFunnel', 'zohoUsage',
      ].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key, organizationId] });
      });
    };

    const tallyUrl = (type, id) => `tally/org/${organizationId}/trash/${type}/${id}/`;

    const restore = async (row) => {
      if (row.module === 'zoho') {
        await restoreZohoTrashItem({ organizationId, type: row.type, id: row.id });
      } else {
        await apiFetch(`${tallyUrl(row.type, row.id)}restore/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
        });
      }
      invalidate();
    };

    const deleteForever = async (row) => {
      if (row.module === 'zoho') {
        await deleteZohoTrashItemForever({ organizationId, type: row.type, id: row.id });
      } else {
        await apiFetch(tallyUrl(row.type, row.id), {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        });
      }
      invalidate();
    };

    /**
     * Empty one module, or both. `filter` is the screen's current type
     * filter: `all`, a module key, or a `module:slug` pair.
     */
    const empty = async (filter) => {
      const [scope, slug] = String(filter || 'all').split(':');
      const calls = [];

      const emptyTally = (type) => {
        const query = type ? `?type=${type}` : '';
        return apiFetch(`tally/org/${organizationId}/trash/empty/${query}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
        });
      };

      if (scope === 'zoho') {
        calls.push(emptyZohoTrash({ organizationId, type: slug }));
      } else if (scope === 'tally') {
        calls.push(emptyTally(slug));
      } else {
        calls.push(emptyTally(), emptyZohoTrash({ organizationId }));
      }

      const results = await Promise.all(calls);
      invalidate();
      const total = results.reduce((n, r) => n + (r?.deleted_count || 0), 0);
      return { deleted_count: total, message: `${total} document(s) permanently deleted` };
    };

    return { restore, deleteForever, empty };
  }, [organizationId, queryClient]);
};
