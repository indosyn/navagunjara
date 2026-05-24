/** @jest-environment node */
/**
 * Tests for image upload / delete routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/image.service", () => ({
  imageService: {
    upload: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { POST as upload } from "@/app/api/v1/images/upload/route";
import { DELETE } from "@/app/api/v1/images/[id]/route";
import { getApiSession } from "@/lib/api-auth";
import { imageService } from "@/services/image.service";
import { paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

/**
 * Build a NextRequest with multipart/form-data body. NextRequest auto-detects
 * the boundary when we pass a FormData object as the body.
 */
function makeUploadRequest(form: FormData): import("next/server").NextRequest {
  const { NextRequest } = jest.requireActual("next/server") as typeof import("next/server");
  return new NextRequest(new URL("http://localhost:3000/api/v1/images/upload"), {
    method: "POST",
    body: form,
  });
}

describe("POST /api/v1/images/upload", () => {
  beforeEach(() => jest.clearAllMocks());

  it("403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const fd = new FormData();
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(403);
  });

  it("400 missing productId", async () => {
    getSession.mockResolvedValueOnce(admin);
    const fd = new FormData();
    fd.append("images", new File(["x"], "x.png", { type: "image/png" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(400);
  });

  it("400 no files", async () => {
    getSession.mockResolvedValueOnce(admin);
    const fd = new FormData();
    fd.append("productId", "1");
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(400);
  });

  it("400 wrong type", async () => {
    getSession.mockResolvedValueOnce(admin);
    const fd = new FormData();
    fd.append("productId", "1");
    fd.append("images", new File(["x"], "x.gif", { type: "image/gif" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(400);
  });

  it("400 file too large", async () => {
    getSession.mockResolvedValueOnce(admin);
    const fd = new FormData();
    fd.append("productId", "1");
    const big = new Uint8Array(6 * 1024 * 1024);
    fd.append("images", new File([big], "big.png", { type: "image/png" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(400);
  });

  it("201 success", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.upload as jest.Mock).mockResolvedValueOnce([{ id: "i" }]);
    const fd = new FormData();
    fd.append("productId", "1");
    fd.append("images", new File(["x"], "x.png", { type: "image/png" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(201);
  });

  it("404 PRODUCT_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.upload as jest.Mock).mockRejectedValueOnce(new Error("PRODUCT_NOT_FOUND"));
    const fd = new FormData();
    fd.append("productId", "1");
    fd.append("images", new File(["x"], "x.png", { type: "image/png" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(404);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.upload as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const fd = new FormData();
    fd.append("productId", "1");
    fd.append("images", new File(["x"], "x.png", { type: "image/png" }));
    const res = await upload(makeUploadRequest(fd));
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/v1/images/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  const { NextRequest } = jest.requireActual("next/server") as typeof import("next/server");
  const req = () =>
    new NextRequest(new URL("http://localhost:3000/api/v1/images/1"), { method: "DELETE" });

  it("403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await DELETE(req(), paramsFor({ id: "1" }));
    expect(res.status).toBe(403);
  });

  it("200", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.remove as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await DELETE(req(), paramsFor({ id: "1" }));
    expect(res.status).toBe(200);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.remove as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await DELETE(req(), paramsFor({ id: "1" }));
    expect(res.status).toBe(404);
  });

  it("500", async () => {
    getSession.mockResolvedValueOnce(admin);
    (imageService.remove as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await DELETE(req(), paramsFor({ id: "1" }));
    expect(res.status).toBe(500);
  });
});
