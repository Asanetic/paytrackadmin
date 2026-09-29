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

import { openSmartMapFilter, openSmartTagFilter, openSmartDateFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { BranchesSchema } from "../../branches/BranchesSchema";

// Local YYYY-MM-DD — not toISOString(), which converts through UTC and
// silently shifts a local midnight back a day in any UTC+ timezone,
// same bug fixed on PayDashboard.jsx's own preset calculator.
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function dateRangeFor(preset) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (preset === "yesterday") {
    const d = new Date(today); d.setDate(d.getDate() - 1);
    return [localISO(d), localISO(d)];
  }
  if (preset === "week") {
    const d = new Date(today); d.setDate(d.getDate() - d.getDay());
    return [localISO(d), localISO(today)];
  }
  if (preset === "month") {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return [localISO(d), localISO(today)];
  }
  return [localISO(today), localISO(today)];
}

// One-click date presets — no picker, known values, so this uses
// ctx.setAdvancedQuery directly (same call openSmartDateFilter's picker
// makes once a range is chosen) instead of a smartFilterActions wrapper.
// combine: true -> merge, so a date preset can stack with an existing
// branch/mode filter instead of clobbering it.
function applyDatePreset(ctx, preset) {
  const [start, end] = dateRangeFor(preset);
  ctx.setAdvancedQuery(
    { transactionAt_start: btoa(start), transactionAt_end: btoa(end) },
    { merge: true }
  );
}

const MoneyflowActions = {
  // Bound by gridOptions.checkFunction in schema.js. Fires with every row
  // the user ticked in the grid's checkbox column. Swap the display-name
  // fallback chain for whatever field this module's rows actually have.
  gridCheckBoxAction: async ({ rows }) => {
    const displayName = (row) => row?.title || row?.name || row?.record_id || 'record';
    alert(`${rows.length} record(s) selected: ${rows.map(displayName).join(', ')}`);
  },

  // Grid-toolbar smart filters — see actionRegistryDocs.md section 8.
  filter_by_branch: (ctx) => openSmartMapFilter(ctx, {
    title: 'Filter by branch',
    searchSchema: BranchesSchema,
    displayField: 'branch_name',
    valueField: 'record_id',
    localColumnKey: 'branch_id',
    combine: true,
  }),

  filter_by_mode: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by payment mode',
    columnKey: 'payment_mode',
    combine: true,

  }),

  filter_by_date: (ctx) => openSmartDateFilter(ctx, {
    title: 'Filter by transaction date',
    columnKey: 'transaction_at',
    inputType: 'date',
    combine: true,

  }),

  // Quick date-range presets — combine: true, so picking one doesn't
  // wipe out an already-applied branch/mode filter.
  filter_today: (ctx) => applyDatePreset(ctx, 'today'),
  filter_yesterday: (ctx) => applyDatePreset(ctx, 'yesterday'),
  filter_this_week: (ctx) => applyDatePreset(ctx, 'week'),
  filter_this_month: (ctx) => applyDatePreset(ctx, 'month'),

  // Add more as needed — see actionRegistryDocs.md for patterns to copy.
  // Every one of them gets whatever's on ctx: { rows, schema, router,
  // refresh, create, update, remove, filter, setFilterValue,
  // setAdvancedQuery, setDateRange, applyFilter, clearFilterValue }.
};


export default MoneyflowActions
