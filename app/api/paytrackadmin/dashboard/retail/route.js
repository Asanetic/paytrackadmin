import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Retail dashboard — cards + charts for the retail/branch view.
// Tenant-scoped via hive_site_id, same date-range shape as
// dashboard/paydashboard (?start=YYYY-MM-DD&end=YYYY-MM-DD).
//
// "Merchant" grouping has no merchant_id FK on payment_transactions
// (only branch_id) — the "by merchant" chart groups by branch, which
// is the real per-transaction relation available. Merchant/branch
// counts come straight from the merchants/branches tables.
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

    const monthsWindowStart = (() => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 11);
      return localDateStr(d);
    })();

    const [
      [totalsRows], [modeRows], [merchantCountRows], [branchCountRows],
      [byBranchRows], [byMonthRows], [recentRows],
    ] = await Promise.all([
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
      conn.execute(
        `SELECT COUNT(*) AS count FROM ${db}.\`merchants\` WHERE hive_site_id = ?`,
        [hiveSiteId]
      ),
      conn.execute(
        `SELECT COUNT(*) AS count FROM ${db}.\`branches\` WHERE hive_site_id = ?`,
        [hiveSiteId]
      ),
      conn.execute(
        `SELECT b.branch_name AS label, COUNT(*) AS trx_count,
                COALESCE(SUM(pt.amount), 0) AS income, COALESCE(SUM(pt.rate_amount), 0) AS charges
         FROM ${db}.\`payment_transactions\` pt
         LEFT JOIN ${db}.\`branches\` b ON b.record_id = pt.branch_id AND b.hive_site_id = pt.hive_site_id
         WHERE pt.hive_site_id = ? AND pt.transaction_at BETWEEN ? AND ?
         GROUP BY pt.branch_id, b.branch_name
         ORDER BY income DESC
         LIMIT 10`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
      conn.execute(
        `SELECT DATE_FORMAT(transaction_at, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS income,
                COALESCE(SUM(rate_amount), 0) AS charges, COUNT(*) AS trx_count
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at >= ?
         GROUP BY month
         ORDER BY month ASC`,
        [hiveSiteId, `${monthsWindowStart} 00:00:00`]
      ),
      conn.execute(
        `SELECT pt.record_id, pt.payment_mode, pt.transaction_id, pt.external_ref, pt.payer_name,
                pt.amount, pt.currency, pt.rate_amount, pt.disbursed, pt.status, pt.transaction_at,
                b.branch_name AS branch_name
         FROM ${db}.\`payment_transactions\` pt
         LEFT JOIN ${db}.\`branches\` b ON b.record_id = pt.branch_id AND b.hive_site_id = pt.hive_site_id
         WHERE pt.hive_site_id = ? AND pt.transaction_at BETWEEN ? AND ?
         ORDER BY pt.transaction_at DESC
         LIMIT 20`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
    ]);

    const totals = totalsRows[0] || {};
    const thisMonth = localDateStr().slice(0, 7);
    const byMonth = byMonthRows.map((r) => ({
      month: r.month,
      income: Number(r.income || 0),
      charges: Number(r.charges || 0),
      trxCount: Number(r.trx_count || 0),
    }));
    const incomeThisMonth = byMonth.find((m) => m.month === thisMonth)?.income || 0;

    return NextResponse.json({
      status: "success",
      data: {
        range: { start, end },
        totals: {
          trxCount: Number(totals.trx_count || 0),
          income: Number(totals.income || 0),
          charges: Number(totals.charges || 0),
          disbursed: Number(totals.disbursed || 0),
          incomeThisMonth,
        },
        merchantCount: Number(merchantCountRows[0]?.count || 0),
        branchCount: Number(branchCountRows[0]?.count || 0),
        modes: modeRows.map((r) => ({
          mode: r.payment_mode || "Other",
          trxCount: Number(r.trx_count || 0),
          income: Number(r.income || 0),
          charges: Number(r.charges || 0),
          disbursed: Number(r.disbursed || 0),
        })),
        byMerchant: byBranchRows.map((r) => ({
          label: r.label || "Unassigned",
          income: Number(r.income || 0),
          charges: Number(r.charges || 0),
          trxCount: Number(r.trx_count || 0),
        })),
        byMonth,
        recent: recentRows.map((r) => ({
          record_id: r.record_id,
          mode: r.payment_mode || "Other",
          transaction_id: r.transaction_id,
          external_ref: r.external_ref,
          payer_name: r.payer_name,
          amount: Number(r.amount || 0),
          currency: r.currency || "KES",
          charges: Number(r.rate_amount || 0),
          disbursed: Number(r.disbursed || 0),
          status: r.status || "Completed",
          branch_name: r.branch_name || "Unassigned",
          transaction_at: r.transaction_at,
        })),
      },
    });
  } catch (error) {
    console.error("dashboard/retail error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
