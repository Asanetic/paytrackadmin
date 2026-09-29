/**
 * Register real behavior here, once per action key. Both grid rowLinks
 * AND profile-level buttons (schema.profileActions) route through this
 * SAME registry — one place to add new behavior, works everywhere.
 *
 * Every registered function receives ONE ctx object instead of a fixed
 * list of positional args — see actionRegistryDocs.md (same folder) for
 * the full ctx field list and worked examples for every action shape
 * used elsewhere in this app (cross-module popups, preset create forms,
 * quick-edit modals, grid-toolbar smart filters, sending messages, etc).
 * Copy the block that matches what you're building from there.
 *
 * NOTE: "delete" and "clone" are intercepted directly by
 * useEntityFormController before they ever reach this registry — don't
 * register functions under those two keys, they will never fire.
 */

import { MosyCard } from "../../../components/MosyCard";
import BranchStatsModal from "../uiControl/BranchStatsModal";
import { openSmartDateFilter, openSmartTagFilter } from "../../moduleControl/UiControl/smartFilterActions";

const BranchesActions = {
  // Bound by gridOptions.checkFunction in schema.js. Fires with every row
  // the user ticked in the grid's checkbox column. Swap the display-name
  // fallback chain for whatever field this module's rows actually have.
  gridCheckBoxAction: async ({ rows }) => {
    const displayName = (row) => row?.title || row?.name || row?.record_id || 'record';
    alert(`${rows.length} record(s) selected: ${rows.map(displayName).join(', ')}`);
  },

  // Payment mode breakdown popup for one branch — see profileActions
  // 'view_stats' in BranchesSchema.js.
  view_stats: ({ rows }) => {
    const row = rows?.[0];
    if (!row) return;
    // 'branchStats' was never a registered modal id (DynamicModalProvider
    // only mounts modal1-4/smartmodaldefaultId/topmost) — MosyCard just
    // no-ops on an unknown id. 'modal1' is a real registered instance.
    MosyCard(
      `Stats — ${row.branch_name || ''}`,
      <BranchStatsModal branchId={row.record_id} />,
      true,
      'modal1',
      'mosycard_wide'
    );
  },

  // Grid-toolbar smart filters — see profileActions 'filter_by_date' /
  // 'filter_by_status' in BranchesSchema.js.
  filter_by_date: (ctx) => openSmartDateFilter(ctx, {
    columnKey: 'created_at',
    title: 'Filter by date registered',
    inputType: 'date',
  }),
  filter_by_status: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by status',
    columnKey: 'status',
  }),

  // Add more as needed — see actionRegistryDocs.md for patterns to copy.
  // Every one of them gets whatever's on ctx: { rows, schema, router,
  // refresh, create, update, remove, filter, setFilterValue,
  // setAdvancedQuery, setDateRange, applyFilter, clearFilterValue }.
};


export default BranchesActions
