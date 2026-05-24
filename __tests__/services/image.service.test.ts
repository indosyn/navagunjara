/**
 * Unit tests for image service.
 *
 * @module __tests__/services/image.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() }),
}));

const mockUpload = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/lib/cloudinary", () => ({
  uploadImage: (...a: unknown[]) => mockUpload(...a),
  deleteImage: (...a: unknown[]) => mockDelete(...a),
}));

import { imageService } from "@/services/image.service";

const MOCK_PRODUCT = { id: BigInt(10), productType: "JEWELRY", imageUrl: null };
const MOCK_IMAGE = {
  id: BigInt(1),
  productId: BigInt(10),
  url: "https://cdn/x.jpg",
  publicId: "pid",
  alt: "x",
  sortOrder: 0,
};

beforeEach(() => jest.clearAllMocks());

describe("imageService.upload", () => {
  it("uploads files and creates records, setting first as primary", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.productImage.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: null } });
    mockUpload.mockResolvedValue({ url: "https://cdn/x.jpg", publicId: "pid" });
    (mockDb.productImage.create as jest.Mock).mockResolvedValue(MOCK_IMAGE);
    (mockDb.product.update as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const res = await imageService.upload("10", [{ buffer: Buffer.from("a"), filename: "x.jpg" }]);
    expect(res).toHaveLength(1);
    expect(mockUpload).toHaveBeenCalledWith(expect.any(Buffer), "jewelry");
    expect(mockDb.product.update).toHaveBeenCalled(); // primary set
  });

  it("uses 'clothing' folder for CLOTHING products", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT, productType: "CLOTHING" });
    (mockDb.productImage.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 0 } });
    mockUpload.mockResolvedValue({ url: "u", publicId: "p" });
    (mockDb.productImage.create as jest.Mock).mockResolvedValue(MOCK_IMAGE);

    await imageService.upload("10", [{ buffer: Buffer.from("a"), filename: "x.jpg" }]);
    expect(mockUpload).toHaveBeenCalledWith(expect.any(Buffer), "clothing");
  });

  it("does not set primary when product already has images", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.productImage.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 2 } });
    mockUpload.mockResolvedValue({ url: "u", publicId: "p" });
    (mockDb.productImage.create as jest.Mock).mockResolvedValue(MOCK_IMAGE);

    await imageService.upload("10", [{ buffer: Buffer.from("a"), filename: "x.jpg" }]);
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("strips extension when deriving alt text", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.productImage.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 5 } });
    mockUpload.mockResolvedValue({ url: "u", publicId: "p" });
    (mockDb.productImage.create as jest.Mock).mockResolvedValue(MOCK_IMAGE);

    await imageService.upload("10", [{ buffer: Buffer.from("a"), filename: "necklace.png" }]);
    expect((mockDb.productImage.create as jest.Mock).mock.calls[0][0].data.alt).toBe("necklace");
  });

  it("throws PRODUCT_NOT_FOUND", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(imageService.upload("10", [])).rejects.toThrow("PRODUCT_NOT_FOUND");
  });
});

describe("imageService.listByProduct", () => {
  it("returns ordered images", async () => {
    (mockDb.productImage.findMany as jest.Mock).mockResolvedValue([MOCK_IMAGE]);
    const res = await imageService.listByProduct("10");
    expect(res).toHaveLength(1);
  });
});

describe("imageService.remove", () => {
  it("deletes from cloudinary and db", async () => {
    (mockDb.productImage.findUnique as jest.Mock).mockResolvedValue(MOCK_IMAGE);
    mockDelete.mockResolvedValue(undefined);
    (mockDb.productImage.delete as jest.Mock).mockResolvedValue(MOCK_IMAGE);
    await imageService.remove("1");
    expect(mockDelete).toHaveBeenCalledWith("pid");
    expect(mockDb.productImage.delete).toHaveBeenCalled();
  });

  it("skips cloudinary delete when publicId missing", async () => {
    (mockDb.productImage.findUnique as jest.Mock).mockResolvedValue({ ...MOCK_IMAGE, publicId: null });
    (mockDb.productImage.delete as jest.Mock).mockResolvedValue(MOCK_IMAGE);
    await imageService.remove("1");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when image missing", async () => {
    (mockDb.productImage.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(imageService.remove("1")).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND for non-numeric id (e.g. placeholder-id)", async () => {
    await expect(imageService.remove("placeholder-id")).rejects.toThrow("NOT_FOUND");
  });
});
