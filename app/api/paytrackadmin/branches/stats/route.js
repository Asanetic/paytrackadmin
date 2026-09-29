import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Per-branch stats — payment mode breakdown for the branch profile's
// "Stats" popup: trx count, income, charges, disbursed per mode, plus
// the branch's overall totals. Tenant + branch scoped.
//
//   GET /api/paytrackadmin/branches/stats?branch_id=<branches.record_id>
// ════════════════════════════════════════════════════════════════

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");

    const { valid, reason, data: authData } = processAuthToken(request);
    if (!valid) {
      return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    }

    const hiveSiteId = authData?.hive_site_id;
    if (!hiveSiteId) {
      return NextResponse.json({ status: "error", message: "No tenant on this session." }, { status: 400 });
    }
    if (!branchId) {
      return NextResponse.json({ status: "error", message: "branch_id is required." }, { status: 400 });
    }

    const conn = await connectDB();
    const db = `\`${activeDB}\``;

    const [[modeRows], [totalsRows]] = await Promise.all([
      conn.execute(
        `SELECT payment_mode, COUNT(*) AS trx_count, COALESCE(SUM(amount), 0) AS income,
                COALESCE(SUM(rate_amount), 0) AS charges, COALESCE(SUM(disbursed), 0) AS disbursed
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND branch_id = ?
         GROUP BY payment_mode
         ORDER BY income DESC`,
        [hiveSiteId, branchId]
      ),
      conn.execute(
        `SELECT COUNT(*) AS trx_count, COALESCE(SUM(amount), 0) AS income,
                COALESCE(SUM(rate_amount), 0) AS charges, COALESCE(SUM(disbursed), 0) AS disbursed
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND branch_id = ?`,
        [hiveSiteId, branchId]
      ),
    ]);

    const totals = totalsRows[0] || {};

    return NextResponse.json({
      status: "success",
      data: {
        totals: {
          trxCount: Number(totals.trx_count || 0),
          income: Number(totals.income || 0),
          charges: Number(totals.charges || 0),
          disbursed: Number(totals.disbursed || 0),
        },
        modes: modeRows.map((r) => ({
          mode: r.payment_mode || "Other",
          trxCount: Number(r.trx_count || 0),
          income: Number(r.income || 0),
          charges: Number(r.charges || 0),
          disbursed: Number(r.disbursed || 0),
        })),
      },
    });
  } catch (error) {
    console.error("branches/stats error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
