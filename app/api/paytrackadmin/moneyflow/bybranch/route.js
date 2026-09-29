import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Money flow — grouped by date/period + branch + payment mode. Real
// SQL GROUP BY + SUM(amount), tenant-scoped, joined to branches for
// the branch name — NOT the grid's client-side "sum what's on the
// current page" convention (see moneyflow/bymethod's route.js for
// the same approach without the branch dimension).
//
//   GET /api/paytrack/moneyflow/bybranch
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
//   -> { status, data: [{ period, branch_id, branch_name, payment_mode, total, count }], grandTotal }
// ════════════════════════════════════════════════════════════════

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
      ? "DATE_FORMAT(pt.`transaction_at`, '%Y-%m')"
      : "DATE(pt.`transaction_at`)";

    const where = ["pt.`hive_site_id` = ?"];
    const values = [hiveSiteId];

    if (branchId) {
      where.push("pt.`branch_id` = ?");
      values.push(branchId);
    }
    if (paymentMode) {
      where.push("pt.`payment_mode` = ?");
      values.push(paymentMode);
    }
    if (start && isDate(start)) {
      where.push("pt.`transaction_at` >= ?");
      values.push(`${start} 00:00:00`);
    }
    if (end && isDate(end)) {
      where.push("pt.`transaction_at` <= ?");
      values.push(`${end} 23:59:59`);
    }

    const sql = `
      SELECT ${periodExpr} AS period,
             pt.\`branch_id\` AS branch_id,
             b.\`branch_name\` AS branch_name,
             pt.\`payment_mode\` AS payment_mode,
             SUM(pt.\`amount\`) AS total,
             SUM(pt.\`rate_amount\`) AS charges,
             SUM(pt.\`disbursed\`) AS disbursed,
             COUNT(*) AS count
      FROM \`${activeDB}\`.\`payment_transactions\` pt
      LEFT JOIN \`${activeDB}\`.\`branches\` b ON b.\`record_id\` = pt.\`branch_id\`
      WHERE ${where.join(" AND ")}
      GROUP BY period, pt.\`branch_id\`, pt.\`payment_mode\`
      ORDER BY period DESC, branch_name ASC, payment_mode ASC
    `;

    const conn = await connectDB();
    const [rows] = await conn.execute(sql, values);

    const data = (rows || []).map((r) => ({
      period: r.period,
      branch_id: r.branch_id || "",
      branch_name: r.branch_name || "Unassigned branch",
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
    console.error("moneyflow/bybranch error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
