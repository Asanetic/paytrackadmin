import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// All-branch, all-time summary for BranchesList's grid-top `stats`
// (SmartGridInsight). Unlike the grid's own sum:true columns — which
// only total the CURRENT PAGE of rows — this aggregates across every
// branch for the tenant in one query.
//
//   GET /api/paytrackadmin/branches/summary
// ════════════════════════════════════════════════════════════════

export async function GET(request) {
  try {
    const { valid, reason, data: authData } = processAuthToken(request);
    if (!valid) {
      return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    }

    const hiveSiteId = authData?.hive_site_id;
    if (!hiveSiteId) {
      return NextResponse.json({ status: "error", message: "No tenant on this session." }, { status: 400 });
    }

    const conn = await connectDB();
    const db = `\`${activeDB}\``;

    const [[branchRows], [txnRows]] = await Promise.all([
      conn.execute(
        `SELECT COUNT(*) AS count FROM ${db}.\`branches\` WHERE hive_site_id = ?`,
        [hiveSiteId]
      ),
      conn.execute(
        `SELECT COALESCE(SUM(amount), 0) AS paid, COALESCE(SUM(rate_amount), 0) AS charges,
                COALESCE(SUM(disbursed), 0) AS disbursed
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ?`,
        [hiveSiteId]
      ),
    ]);

    const txn = txnRows[0] || {};

    return NextResponse.json({
      status: "success",
      data: {
        branchCount: Number(branchRows[0]?.count || 0),
        totalPaid: Number(txn.paid || 0),
        totalCharges: Number(txn.charges || 0),
        totalDisbursed: Number(txn.disbursed || 0),
      },
    });
  } catch (error) {
    console.error("branches/summary error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
