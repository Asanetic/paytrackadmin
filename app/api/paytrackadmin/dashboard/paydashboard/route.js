import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// ════════════════════════════════════════════════════════════════
// Pay dashboard — real numbers for PayDashboard (app/dash/PayDashboard.jsx):
// hero totals, per-method breakdown, recent payments, and an attention
// list. Tenant-scoped via hive_site_id, real SQL aggregates (no
// client-side "sum what's loaded" — same standalone-route approach as
// gatewayipn and the moneyflow bymethod/bybranch reports.
//
//   GET /api/paytrack/dashboard/paydashboard
//     ?start=YYYY-MM-DD   (optional, inclusive; default = today)
//     &end=YYYY-MM-DD     (optional, inclusive; default = today)
//
// "Matched" (payment_matches) dropped from the hero — that table has no
// producer anywhere in the app yet, so it always read 0/0/0%, which is
// misleading rather than informative. Replaced with the metric that
// actually matters here: cash coverage on active days.
//
// Cash is the one payment mode the system can't see automatically (no
// gateway/IPN callback for it, unlike M-Pesa/card/bank) — it only shows
// up if someone logs it by hand. So a day with OTHER payments recorded
// but ZERO cash isn't "a quiet cash day," it's a likely missed capture
// (till/CDM cash never logged). Those days:
//   - count against hero's coverage widget (daysCashVerified / daysWithActivity)
//   - become their own attention item, prompting the user to log cash
// A day with no activity at all (closed) is excluded from both — it was
// never a candidate for a missed cash entry.
// ════════════════════════════════════════════════════════════════

const isDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
// Local YYYY-MM-DD — not toISOString(), which shifts a day backward in
// any UTC+ timezone (e.g. Africa/Nairobi) and was silently excluding
// today from date-range filters.
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

    // Last 12 calendar months including the current one — independent of
    // the start/end range filter above, this is a standing trend view.
    const monthsWindowStart = (() => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 11);
      return localDateStr(d);
    })();

    const [[heroRows], [attentionCountRows], [methodRows], [recentRows], [exceptionRows], [dayTotalsRows], [monthlyRows]] = await Promise.all([
      conn.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS total_count
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at BETWEEN ? AND ?`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
      conn.execute(
        `SELECT COUNT(*) AS attention_count
         FROM ${db}.\`exceptions\`
         WHERE hive_site_id = ? AND status != 'Resolved'`,
        [hiveSiteId]
      ),
      conn.execute(
        `SELECT payment_mode AS payment_mode, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at BETWEEN ? AND ?
         GROUP BY payment_mode
         ORDER BY total DESC`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
      conn.execute(
        `SELECT record_id, payment_mode, transaction_id, external_ref, amount, currency, status, transaction_at
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ?
         ORDER BY transaction_at DESC
         LIMIT 6`,
        [hiveSiteId]
      ),
      conn.execute(
        `SELECT e.record_id, e.exception_type, e.title, e.severity, e.status,
                e.expected_amount, e.actual_amount, e.difference_amount, e.created_at,
                pt.external_ref AS payment_ref
         FROM ${db}.\`exceptions\` e
         LEFT JOIN ${db}.\`payment_transactions\` pt ON pt.record_id = e.payment_transaction_id
         WHERE e.hive_site_id = ? AND e.status != 'Resolved'
         ORDER BY e.created_at DESC
         LIMIT 6`,
        [hiveSiteId]
      ),
      // Per-day totals + cash-only totals in one pass, so "active day with
      // zero cash" can be computed in JS without a second round trip.
      conn.execute(
        `SELECT DATE(transaction_at) AS day,
                COUNT(*) AS count,
                SUM(amount) AS total,
                SUM(CASE WHEN payment_mode = 'Cash' THEN 1 ELSE 0 END) AS cash_count,
                SUM(CASE WHEN payment_mode = 'Cash' THEN amount ELSE 0 END) AS cash_total
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at BETWEEN ? AND ?
         GROUP BY day
         ORDER BY day DESC`,
        [hiveSiteId, rangeStart, rangeEnd]
      ),
      conn.execute(
        `SELECT DATE_FORMAT(transaction_at, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
         FROM ${db}.\`payment_transactions\`
         WHERE hive_site_id = ? AND transaction_at >= ?
         GROUP BY month
         ORDER BY month ASC`,
        [hiveSiteId, `${monthsWindowStart} 00:00:00`]
      ),
    ]);

    const totalAmount = Number(heroRows[0]?.total_amount || 0);
    const totalCount = Number(heroRows[0]?.total_count || 0);
    const exceptionCount = Number(attentionCountRows[0]?.attention_count || 0);

    const daysWithActivity = dayTotalsRows.length;
    const missingCashDayRows = dayTotalsRows.filter((r) => Number(r.cash_count || 0) === 0);
    const daysMissingCash = missingCashDayRows.length;
    const daysCashVerified = daysWithActivity - daysMissingCash;
    const attentionCount = exceptionCount + daysMissingCash;

    const methods = methodRows.map((r) => ({
      payment_mode: r.payment_mode || "Other",
      total: Number(r.total || 0),
      count: Number(r.count || 0),
    }));

    const recent = recentRows.map((r) => ({
      record_id: r.record_id,
      payment_mode: r.payment_mode || "Other",
      transaction_id: r.transaction_id,
      external_ref: r.external_ref,
      amount: Number(r.amount || 0),
      currency: r.currency || "KES",
      status: r.status || "Completed",
      transaction_at: r.transaction_at,
    }));

    const exceptionItems = exceptionRows.map((r) => ({
      record_id: r.record_id,
      type: "exception",
      title: r.title || r.exception_type || "Exception",
      severity: r.severity || "medium",
      amount: Number(r.difference_amount ?? r.expected_amount ?? 0),
      payment_ref: r.payment_ref,
      at: r.created_at,
    }));

    const missingCashItems = missingCashDayRows.map((r) => ({
      record_id: `nocash-${r.day}`,
      type: "missing_cash",
      title: "No cash logged — log till/CDM cash for this day",
      severity: "high",
      amount: Number(r.total || 0),
      count: Number(r.count || 0),
      day: r.day,
      at: r.day,
    }));

    const attention = [...exceptionItems, ...missingCashItems]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 8);

    const monthly = monthlyRows.map((r) => ({
      month: r.month,
      total: Number(r.total || 0),
      count: Number(r.count || 0),
    }));

    return NextResponse.json({
      status: "success",
      data: {
        range: { start, end },
        hero: { totalAmount, totalCount, daysWithActivity, daysCashVerified, daysMissingCash, attentionCount },
        methods,
        recent,
        attention,
        monthly,
      },
    });
  } catch (error) {
    console.error("dashboard/paydashboard error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
