import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbSet = vi.fn();
const mockDbWhere = vi.fn();

vi.mock("@openlynk/db", () => {
  return {
    getDb: () => ({
      select: () => {
        const queryObj = {
          then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
            return Promise.resolve(mockDbSelect()).then(resolve, reject);
          },
          from: () => queryObj,
          where: () => queryObj,
          limit: () => queryObj,
        };
        return queryObj;
      },
      update: () => {
        mockDbUpdate();
        return {
          set: (payload: unknown) => {
            mockDbSet(payload);
            return {
              where: (...args: unknown[]) => {
                mockDbWhere(...args);
                return Promise.resolve();
              },
            };
          },
        };
      },
    }),
    eq: vi.fn((col, val) => ({ col, val })),
    order: {
      id: "order.id",
      midtransOrderId: "order.midtransOrderId",
      status: "order.status",
    },
  };
});

describe("POST /api/webhooks/midtrans Route Handler", () => {
  const serverKey = "SB-Mid-server-MOCKKEY999";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MIDTRANS_SERVER_KEY = serverKey;
  });

  function generateSignature(orderId: string, statusCode: string, grossAmount: string) {
    return crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");
  }

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: "invalid-json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("JSON");
  });

  it("returns 403 when signature_key is invalid and does NOT touch DB", async () => {
    const payload = {
      order_id: "order-123",
      status_code: "200",
      gross_amount: "25000.00",
      signature_key: "tampered_invalid_signature",
      transaction_status: "settlement",
    };

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Signature");
    expect(mockDbSelect).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when order is not found in database", async () => {
    const orderId = "order-not-found";
    const statusCode = "200";
    const grossAmount = "25000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "settlement",
    };

    mockDbSelect.mockResolvedValueOnce([]); // no order

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("tidak ditemukan");
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("returns 422 when gross_amount does not match order amount_idr", async () => {
    const orderId = "order-amount-mismatch";
    const statusCode = "200";
    const grossAmount = "50000.00"; // payload says 50000
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "settlement",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-id",
        midtransOrderId: orderId,
        amountIdr: 25000, // DB expects 25000
        status: "pending",
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain("tidak cocok");
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("updates order status to paid and records paid_at on settlement", async () => {
    const orderId = "order-settlement-1";
    const statusCode = "200";
    const grossAmount = "25000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "settlement",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-1",
        midtransOrderId: orderId,
        amountIdr: 25000,
        status: "pending",
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        paidAt: expect.any(Date),
      })
    );
  });

  it("updates order status to paid on capture with fraud_status accept", async () => {
    const orderId = "order-capture-1";
    const statusCode = "200";
    const grossAmount = "100000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "capture",
      fraud_status: "accept",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-2",
        midtransOrderId: orderId,
        amountIdr: 100000,
        status: "pending",
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        paidAt: expect.any(Date),
      })
    );
  });

  it("updates order status to expired on expire", async () => {
    const orderId = "order-expire-1";
    const statusCode = "200";
    const grossAmount = "25000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "expire",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-3",
        midtransOrderId: orderId,
        amountIdr: 25000,
        status: "pending",
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "expired",
      })
    );
  });

  it("updates order status to failed on cancel or deny", async () => {
    const orderId = "order-cancel-1";
    const statusCode = "200";
    const grossAmount = "25000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "cancel",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-4",
        midtransOrderId: orderId,
        amountIdr: 25000,
        status: "pending",
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
      })
    );
  });

  it("IDEMPOTENSI: does NOT downgrade status if order is already paid", async () => {
    const orderId = "order-already-paid";
    const statusCode = "200";
    const grossAmount = "25000.00";
    const signatureKey = generateSignature(orderId, statusCode, grossAmount);

    // Later webhook says expire (e.g. out-of-order webhook delivery)
    const payload = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "expire",
    };

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-db-paid",
        midtransOrderId: orderId,
        amountIdr: 25000,
        status: "paid", // Already paid!
      },
    ]);

    const req = new Request("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("penurunan status diabaikan");
    // Verify DB update was NOT called
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});
