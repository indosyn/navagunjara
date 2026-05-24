/** @jest-environment node */
/**
 * Tests for customer routes (list + register + me + me/password + [id]).
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/customer.service", () => ({
  customerService: {
    list: jest.fn(),
    register: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    anonymize: jest.fn(),
    changePassword: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({ allowed: true, resetMs: 0 })),
  enforceRateLimit: jest.fn(() => null),
}));

import { GET as listCustomers } from "@/app/api/v1/customers/route";
import { GET as registerList, POST as register } from "@/app/api/v1/customers/register/route";
import { GET as detailGet, PUT as detailPut } from "@/app/api/v1/customers/[id]/route";
import { GET as meGet, DELETE as meDelete } from "@/app/api/v1/customers/me/route";
import { PUT as pwPut } from "@/app/api/v1/customers/me/password/route";
import { getApiSession } from "@/lib/api-auth";
import { customerService } from "@/services/customer.service";
import { rateLimit } from "@/lib/rate-limit";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const rateLimitMock = rateLimit as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

const validRegister = {
  firstName: "P",
  lastName: "S",
  email: "p@x.com",
  password: "Password@123",
  phone: "9876543210",
  addressLine1: "123 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

describe("/api/v1/customers (GET)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 without session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await listCustomers(makeRequest("/api/v1/customers"));
    expect(res.status).toBe(401);
  });

  it("403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await listCustomers(makeRequest("/api/v1/customers"));
    expect(res.status).toBe(403);
  });

  it("200 admin", async () => {
    getSession.mockResolvedValueOnce(admin);
    (customerService.list as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await listCustomers(makeRequest("/api/v1/customers"));
    expect(res.status).toBe(200);
  });
});

describe("/api/v1/customers/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetMs: 0 });
  });

  it("POST 201 success", async () => {
    (customerService.register as jest.Mock).mockResolvedValueOnce({ id: "2", ...validRegister });
    const res = await register(makeRequest("/api/v1/customers/register", { method: "POST", body: validRegister }));
    expect(res.status).toBe(201);
  });

  it("POST 400 invalid", async () => {
    const res = await register(makeRequest("/api/v1/customers/register", { method: "POST", body: { email: "bad" } }));
    expect(res.status).toBe(400);
  });

  it("POST 409 duplicate email", async () => {
    (customerService.register as jest.Mock).mockRejectedValueOnce(new Error("DUPLICATE_EMAIL"));
    const res = await register(makeRequest("/api/v1/customers/register", { method: "POST", body: validRegister }));
    expect(res.status).toBe(409);
  });

  it("POST 500 generic", async () => {
    (customerService.register as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await register(makeRequest("/api/v1/customers/register", { method: "POST", body: validRegister }));
    expect(res.status).toBe(500);
  });

  it("POST 429 rate-limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetMs: 10_000 });
    const res = await register(makeRequest("/api/v1/customers/register", { method: "POST", body: validRegister }));
    expect(res.status).toBe(429);
  });

  it("GET (admin) 200", async () => {
    getSession.mockResolvedValueOnce(admin);
    (customerService.list as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await registerList(makeRequest("/api/v1/customers/register"));
    expect(res.status).toBe(200);
  });

  it("GET 401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await registerList(makeRequest("/api/v1/customers/register"));
    expect(res.status).toBe(401);
  });

  it("GET 403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await registerList(makeRequest("/api/v1/customers/register"));
    expect(res.status).toBe(403);
  });
});

describe("/api/v1/customers/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await detailGet(makeRequest("/api/v1/customers/2"), paramsFor({ id: "2" }));
    expect(res.status).toBe(401);
  });

  it("GET 200", async () => {
    getSession.mockResolvedValueOnce(admin);
    (customerService.findById as jest.Mock).mockResolvedValueOnce({ id: "2" });
    const res = await detailGet(makeRequest("/api/v1/customers/2"), paramsFor({ id: "2" }));
    expect(res.status).toBe(200);
  });

  it("GET 404", async () => {
    getSession.mockResolvedValueOnce(admin);
    (customerService.findById as jest.Mock).mockRejectedValueOnce(new Error("x"));
    const res = await detailGet(makeRequest("/api/v1/customers/2"), paramsFor({ id: "2" }));
    expect(res.status).toBe(404);
  });

  it("PUT 401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await detailPut(
      makeRequest("/api/v1/customers/2", { method: "PUT", body: {} }),
      paramsFor({ id: "2" })
    );
    expect(res.status).toBe(401);
  });

  it("PUT 403 different user non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await detailPut(
      makeRequest("/api/v1/customers/99", { method: "PUT", body: {} }),
      paramsFor({ id: "99" })
    );
    expect(res.status).toBe(403);
  });

  it("PUT 200 own profile", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.update as jest.Mock).mockResolvedValueOnce({ id: "2", firstName: "X" });
    const res = await detailPut(
      makeRequest("/api/v1/customers/2", { method: "PUT", body: { firstName: "X" } }),
      paramsFor({ id: "2" })
    );
    expect(res.status).toBe(200);
  });

  it("PUT 400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await detailPut(
      makeRequest("/api/v1/customers/2", { method: "PUT", body: { phone: "bad" } }),
      paramsFor({ id: "2" })
    );
    expect(res.status).toBe(400);
  });

  it("PUT 500 generic", async () => {
    getSession.mockResolvedValueOnce(admin);
    (customerService.update as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await detailPut(
      makeRequest("/api/v1/customers/2", { method: "PUT", body: { firstName: "X" } }),
      paramsFor({ id: "2" })
    );
    expect(res.status).toBe(500);
  });
});

describe("/api/v1/customers/me", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await meGet(makeRequest("/api/v1/customers/me"));
    expect(res.status).toBe(401);
  });

  it("GET 200", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.findById as jest.Mock).mockResolvedValueOnce({ id: "2" });
    const res = await meGet(makeRequest("/api/v1/customers/me"));
    expect(res.status).toBe(200);
  });

  it("GET 404", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.findById as jest.Mock).mockRejectedValueOnce(new Error("x"));
    const res = await meGet(makeRequest("/api/v1/customers/me"));
    expect(res.status).toBe(404);
  });

  it("DELETE 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await meDelete(makeRequest("/api/v1/customers/me", { method: "DELETE" }));
    expect(res.status).toBe(401);
  });

  it("DELETE deactivate", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.deactivate as jest.Mock).mockResolvedValueOnce({ id: "2", status: "DEACTIVATED" });
    const res = await meDelete(makeRequest("/api/v1/customers/me", { method: "DELETE" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/deactivated/);
  });

  it("DELETE anonymize", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.anonymize as jest.Mock).mockResolvedValueOnce({ id: "2" });
    const res = await meDelete(
      makeRequest("/api/v1/customers/me", { method: "DELETE", searchParams: { anonymize: "true" } })
    );
    expect(res.status).toBe(200);
    expect(customerService.anonymize).toHaveBeenCalled();
  });

  it("DELETE 404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.deactivate as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await meDelete(makeRequest("/api/v1/customers/me", { method: "DELETE" }));
    expect(res.status).toBe(404);
  });

  it("DELETE 500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.deactivate as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await meDelete(makeRequest("/api/v1/customers/me", { method: "DELETE" }));
    expect(res.status).toBe(500);
  });
});

describe("/api/v1/customers/me/password", () => {
  beforeEach(() => jest.clearAllMocks());

  const body = { currentPassword: "Password@123", newPassword: "NewPass@1234" };

  it("PUT 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await pwPut(
      makeRequest("/api/v1/customers/me/password", { method: "PUT", body })
    );
    expect(res.status).toBe(401);
  });

  it("PUT 400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await pwPut(
      makeRequest("/api/v1/customers/me/password", { method: "PUT", body: {} })
    );
    expect(res.status).toBe(400);
  });

  it("PUT 200", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.changePassword as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await pwPut(
      makeRequest("/api/v1/customers/me/password", { method: "PUT", body })
    );
    expect(res.status).toBe(200);
  });

  it("PUT 400 INVALID_CURRENT_PASSWORD", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.changePassword as jest.Mock).mockRejectedValueOnce(
      new Error("INVALID_CURRENT_PASSWORD")
    );
    const res = await pwPut(
      makeRequest("/api/v1/customers/me/password", { method: "PUT", body })
    );
    expect(res.status).toBe(400);
  });

  it("PUT 500", async () => {
    getSession.mockResolvedValueOnce(user);
    (customerService.changePassword as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await pwPut(
      makeRequest("/api/v1/customers/me/password", { method: "PUT", body })
    );
    expect(res.status).toBe(500);
  });
});
