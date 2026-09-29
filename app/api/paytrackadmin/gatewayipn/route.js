import { NextResponse } from "next/server";
import {
  magicRandomStr,
  mosyQddata,
  mosySqlInsert,
} from "../../apiUtils/dataControl/dataUtils";

// ════════════════════════════════════════════════════════════════
// Gateway IPN — reusable transaction-logging webhook for the Quick
// Pay simulator (and any future real gateway callback with the same
// shape). Same pattern as smartpaymentipn: no app auth token, tenant
// is resolved server-side from the payload's merchantId, never
// trusted from the caller directly.
//
// Writes into the EXISTING tables rather than a new one:
//   payment_transactions — canonical raw event (branch/source/amount/
//     status/metadata/raw_payload), same shape business_events feeds
//     reconciliation from.
//   smart_payments        — receipt-style record, same table/shape
//     smartpaymentipn already writes for every other payment channel.
//   business_events       — a "Money In" event tied to the same
//     transaction (external_ref = receipt no), so this collection
//     shows up in the events/reconciliation modules like any other
//     inbound money event.
//
//   POST { merchantId, branchId, branchName, userId, userName,
//          amount, currency, method, methodLabel, details }
//
//   details is method-specific and NEVER includes a card PIN —
//   only non-secret fields (phone, viaStk, txnCode) are persisted.
// ════════════════════════════════════════════════════════════════

// No branch row, or the branch has nothing set for this method or as
// a fallback — last resort so a transaction never silently gets 0%.
const SYSTEM_DEFAULT_RATE = 0;

const METHOD_RATE_COLUMN = {
  cash: "transaction_rate_cash",
  card: "transaction_rate_card",
  mpesa: "transaction_rate_mpesa",
};

// Method-specific branch rate -> branch default -> system default.
function resolveRate(branch, method) {
  const col = METHOD_RATE_COLUMN[method];
  const methodRate = col ? branch?.[col] : null;
  if (methodRate !== null && methodRate !== undefined && methodRate !== "") {
    return Number(methodRate);
  }
  if (branch?.default_transaction_rate !== null && branch?.default_transaction_rate !== undefined && branch?.default_transaction_rate !== "") {
    return Number(branch.default_transaction_rate);
  }
  return SYSTEM_DEFAULT_RATE;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      merchantId,
      branchId,
      branchName,
      userId,
      userName,
      amount,
      currency = "KES",
      method,
      methodLabel,
      details,
    } = body || {};

    if (!merchantId) {
      return NextResponse.json(
        { status: "error", message: "merchantId is required" },
        { status: 400 }
      );
    }

    // Resolve tenant strictly from the merchant record — never from
    // anything the client claims directly.
    const merchant = await mosyQddata("merchants", "record_id", String(merchantId));
    if (!merchant) {
      return NextResponse.json(
        { status: "error", message: "Unknown merchant" },
        { status: 404 }
      );
    }

    const hive_site_id = merchant.hive_site_id || "";
    const hive_site_name = merchant.hive_site_name || "";

    // Branch's per-method rate, falling back to its default_transaction_rate,
    // then a system default — never left unset on the payment record.
    const branch = branchId ? await mosyQddata("branches", "record_id", String(branchId)) : null;
    const rate = resolveRate(branch, method);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const trx_time_stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const trx_date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Strip anything secret before it ever reaches storage/logs.
    const { pin, ...safeDetails } = details || {};

    const amountNum = Number(amount || 0) || 0;
    const rateAmount = Math.round(amountNum * (rate / 100) * 100) / 100;
    const disbursedAmount = Math.round((amountNum - rateAmount) * 100) / 100;

    const amountPaid = String(amountNum);
    const receiptNo = `SIM-${Date.now().toString().slice(-8)}`;
    const transactionCode = safeDetails.txnCode || safeDetails.phone || receiptNo;

    // 1) payment_transactions — canonical raw event for reconciliation.
    // No merchant_id column on this table; merchant identity + cashier
    // context ride along in metadata (tenant scoping already came from
    // hive_site_id above, resolved from merchantId server-side).
    const trxRecordId = magicRandomStr(7);
    const metadata = JSON.stringify({
      merchantId,
      merchantName: merchant.merchant_name || "",
      branchName: branchName || "",
      userId: userId || "",
      userName: userName || "",
      source: "Quick Pay Simulator",
      ...safeDetails,
    });

    await mosySqlInsert(
      "payment_transactions",
      {
        record_id: "?",
        branch_id: "?",
        payment_source_id: "?",
        transaction_id: "?",
        external_ref: "?",
        amount: "?",
        currency: "?",
        payer_name: "?",
        payer_phone: "?",
        payment_mode: "?",
        transaction_at: "?",
        received_at: "?",
        status: "?",
        metadata: "?",
        raw_payload: "?",
        created_at: "?",
        updated_at: "?",
        hive_site_id: "?",
        hive_site_name: "?",
        rate: "?",
        rate_amount: "?",
        disbursed: "?",
      },
      {
        record_id: trxRecordId,
        branch_id: branchId ? String(branchId) : "",
        payment_source_id: "payment_demo",
        transaction_id: transactionCode,
        external_ref: receiptNo,
        amount: amountPaid,
        currency,
        payer_name: userName || "",
        payer_phone: safeDetails.phone || "",
        payment_mode: methodLabel || method || "",
        transaction_at: trx_time_stamp,
        received_at: trx_time_stamp,
        status: "Completed",
        metadata,
        raw_payload: JSON.stringify({ ...body, details: safeDetails }),
        created_at: trx_time_stamp,
        updated_at: trx_time_stamp,
        hive_site_id,
        hive_site_name,
        rate: String(rate),
        rate_amount: String(rateAmount),
        disbursed: String(disbursedAmount),
      }
    );

    // 2) smart_payments — same receipt-style table smartpaymentipn
    // writes to for every other channel, so this shows up alongside
    // M-Pesa IPN payments in the same list/reports.
    await mosySqlInsert(
      "smart_payments",
      {
        record_id: "?",
        payment_reference: "?",
        request_reference: "?",
        related_module: "?",
        related_record_id: "?",
        receipt_number: "?",
        payer_name: "?",
        payer_phone: "?",
        payer_email: "?",
        payment_method: "?",
        payment_channel: "?",
        transaction_code: "?",
        currency: "?",
        amount_paid: "?",
        payment_description: "?",
        payment_notes: "?",
        payment_date: "?",
        payment_status: "?",
        processed_by: "?",
        created_on: "?",
        updated_on: "?",
        created_at: "?",
        updated_at: "?",
        hive_site_id: "?",
        hive_site_name: "?",
        rate: "?",
        rate_amount: "?",
        disbursed_amount: "?",
      },
      {
        record_id: magicRandomStr(7),
        payment_reference: `PAY-${Date.now()}`,
        request_reference: receiptNo,
        related_module: "gateway_simulator",
        related_record_id: trxRecordId,
        receipt_number: receiptNo,
        payer_name: safeDetails.phone ? `POS customer (${safeDetails.phone})` : "POS customer",
        payer_phone: safeDetails.phone || "",
        payer_email: "",
        payment_method: methodLabel || method || "",
        payment_channel: "Quick Pay Simulator",
        transaction_code: transactionCode,
        currency,
        amount_paid: amountPaid,
        payment_description: `POS sale — ${branchName || merchant.merchant_name || "Branch"}`,
        payment_notes: JSON.stringify(safeDetails),
        payment_date: trx_date,
        payment_status: "Completed",
        processed_by: userName || "gateway-simulator",
        created_on: trx_date,
        updated_on: trx_time_stamp,
        created_at: trx_time_stamp,
        updated_at: trx_time_stamp,
        hive_site_id,
        hive_site_name,
        rate: String(rate),
        rate_amount: String(rateAmount),
        disbursed_amount: String(disbursedAmount),
      }
    );

    // 3) business_events — logs this collection as a "Money In" event,
    // linked back to the payment_transactions row via external_ref.
    await mosySqlInsert(
      "business_events",
      {
        record_id: "?",
        branch_id: "?",
        integration_id: "?",
        event_id: "?",
        event_type: "?",
        external_ref: "?",
        amount: "?",
        currency: "?",
        payment_mode: "?",
        client_id: "?",
        occurred_at: "?",
        received_at: "?",
        status: "?",
        metadata: "?",
        raw_payload: "?",
        created_at: "?",
        updated_at: "?",
        hive_site_id: "?",
        hive_site_name: "?",
        event_remark: "?",
      },
      {
        record_id: magicRandomStr(7),
        branch_id: branchId ? String(branchId) : "",
        integration_id: "",
        event_id: `EVT-${Date.now()}`,
        event_type: "Money In",
        external_ref: receiptNo,
        amount: amountPaid,
        currency,
        payment_mode: methodLabel || method || "",
        client_id: "",
        occurred_at: trx_time_stamp,
        received_at: trx_time_stamp,
        status: "Completed",
        metadata,
        raw_payload: JSON.stringify({ ...body, details: safeDetails }),
        created_at: trx_time_stamp,
        updated_at: trx_time_stamp,
        hive_site_id,
        hive_site_name,
        event_remark: "Terminal-Payment",
      }
    );

    return NextResponse.json({
      status: "success",
      message: "Transaction logged",
      receiptNo,
      record_id: trxRecordId,
      hive_site_id,
      hive_site_name,
      rate,
      rateAmount,
      disbursedAmount,
    });
  } catch (error) {
    console.error("gatewayipn error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
