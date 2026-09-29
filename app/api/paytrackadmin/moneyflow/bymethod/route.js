import { NextResponse } from "next/server";
import { mosyFlexQuickSel } from "../../../apiUtils/dataControl/dataUtils";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Money flow — grouped by payment mode + date/period. A real SQL
// GROUP BY + SUM(amount), tenant-scoped, NOT the grid's client-side
// "sum what's on the current page" convention — that one silently
// misreports totals once there's more than one page of data.
//
//   GET /api/paytrack/moneyflow/bymethod
//     ?period=day|month   (display granularity, default day)
//     &branchId=<base64 record_id>            (filter_by_branch)
//     &paymentMode=<base64 mode>               (filter_by_mode)
//     &transactionAt_start=<base64 YYYY-MM-DD> (filter_by_date)
//     &transactionAt_end=<base64 YYYY-MM-DD>
//
//   Filter param names/encoding match smartFilterActions.jsx's
//   advancedQuery convention exactly (camelCase key, btoa'd value) —
//   same actions registered for Payments, wired via
//   moneyflow/logicControl/actionsRegistry.js.
//
//   -> { status, data: [{ period, payment_mode, total, count }], grandTotal }
// ════════════════════════════════════════════════════════════════

const esc = (val = "") => String(val).replace(/'/g, "''");
const isDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
const decode = (val) => {
  if (!val) return null;
  try { return atob(val); } catch { return val; }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const { valid, reason, data: authData } = processAuthToken(request);
    if (!valid) {
      return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    }

    const hiveSiteId = authData?.hive_site_id;
    if (!hiveSiteId) {
      return NextResponse.json({ status: "error", message: "No tenant on this session." }, { status: 400 });
    }

    const period = searchParams.get("period") === "month" ? "month" : "day";
    const branchId = decode(searchParams.get("branchId"));
    const paymentMode = decode(searchParams.get("paymentMode"));
    const start = decode(searchParams.get("transactionAt_start"));
    const end = decode(searchParams.get("transactionAt_end"));

    const periodExpr = period === "month"
      ? "DATE_FORMAT(`transaction_at`, '%Y-%m')"
      : "DATE(`transaction_at`)";

    const whereParts = [`\`hive_site_id\` = '${esc(hiveSiteId)}'`];
    if (branchId) whereParts.push(`\`branch_id\` = '${esc(branchId)}'`);
    if (paymentMode) whereParts.push(`\`payment_mode\` = '${esc(paymentMode)}'`);
    if (start && isDate(start)) whereParts.push(`\`transaction_at\` >= '${esc(start)} 00:00:00'`);
    if (end && isDate(end)) whereParts.push(`\`transaction_at\` <= '${esc(end)} 23:59:59'`);

    const whereStr = `WHERE ${whereParts.join(" AND ")}`;
    const cols = `${periodExpr} AS period, \`payment_mode\` AS payment_mode, SUM(\`amount\`) AS total, SUM(\`rate_amount\`) AS charges, SUM(\`disbursed\`) AS disbursed, COUNT(*) AS count`;

    const rows = await mosyFlexQuickSel(
      "payment_transactions",
      cols,
      `${whereStr} GROUP BY period, payment_mode ORDER BY period DESC, payment_mode ASC`,
      "l"
    );

    const data = (rows || []).map((r) => ({
      period: r.period,
      payment_mode: r.payment_mode || "Other",
      total: Number(r.total || 0),
      charges: Number(r.charges || 0),
      disbursed: Number(r.disbursed || 0),
      count: Number(r.count || 0),
    }));

    const grandTotal = data.reduce((s, r) => s + r.total, 0);
    const grandCharges = data.reduce((s, r) => s + r.charges, 0);
    const grandDisbursed = data.reduce((s, r) => s + r.disbursed, 0);

    return NextResponse.json({ status: "success", data, grandTotal, grandCharges, grandDisbursed });
  } catch (error) {
    console.error("moneyflow/bymethod error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
