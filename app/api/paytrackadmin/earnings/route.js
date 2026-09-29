import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Earnings — totals + per-mode breakdown (Trx/Income/Charges/Disbursed)
// for the sidebar's "Earnings" page. Same date-range shape as
// dashboard/paydashboard (?start=YYYY-MM-DD&end=YYYY-MM-DD).
// ════════════════════════════════════════════════════════════════

const isDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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

    const startRaw = searchParams.get("start");
    const endRaw = searchParams.get("end");
    const start = startRaw && isDate(startRaw) ? startRaw : localDateStr();
    const end = endRaw && isDate(endRaw) ? endRaw : localDateStr();
    const rangeStart = `${start} 00:00:00`;
    const rangeEnd = `${end} 23:59:59`;

    const conn = await connectDB();
    const db = `\`${activeDB}\``;

    const [[totalsRows], [modeRows]] = await Promise.all([
      conn.execute(
        `SELECT COUNT(*) AS trx_count, COALESCE(SUM(amount), 0) AS income,
                COALESCE(SUM(rate_amount), 0) AS charges, COALESCE(SUM(disbursed), 0) AS disbursed
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at BETWEEN ? AND ?`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
      conn.execute(
        `SELECT payment_mode, COUNT(*) AS trx_count, COALESCE(SUM(amount), 0) AS income,
                COALESCE(SUM(rate_amount), 0) AS charges, COALESCE(SUM(disbursed), 0) AS disbursed
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at BETWEEN ? AND ?
         GROUP BY payment_mode
         ORDER BY income DESC`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
    ]);

    const totals = totalsRows[0] || {};

    return NextResponse.json({
      status: "success",
      data: {
        range: { start, end },
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
    console.error("earnings error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
