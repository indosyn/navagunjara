/** @jest-environment node */
/**
 * Tests for `lib/cloudinary.ts` — upload/delete helpers.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("cloudinary", () => {
  const upload_stream = jest.fn();
  const destroy = jest.fn();
  return {
    v2: {
      config: jest.fn(),
      uploader: { upload_stream, destroy },
    },
    __upload_stream: upload_stream,
    __destroy: destroy,
  };
});

import { uploadImage, deleteImage } from "@/lib/cloudinary";

const mocks = jest.requireMock("cloudinary") as {
  __upload_stream: jest.Mock;
  __destroy: jest.Mock;
};
const upload_stream = mocks.__upload_stream;
const destroy = mocks.__destroy;

describe("uploadImage", () => {
  beforeEach(() => {
    upload_stream.mockReset();
  });

  it("resolves with url + publicId on success", async () => {
    upload_stream.mockImplementation((_opts, cb) => ({
      end: (_buf: Buffer) =>
        cb(null, { secure_url: "https://cdn/x.jpg", public_id: "navagunjara/jewelry/x" }),
    }));
    const res = await uploadImage(Buffer.from("img"), "jewelry");
    expect(res).toEqual({ url: "https://cdn/x.jpg", publicId: "navagunjara/jewelry/x" });
  });

  it("rejects on error", async () => {
    upload_stream.mockImplementation((_opts, cb) => ({
      end: (_buf: Buffer) => cb(new Error("nope"), null),
    }));
    await expect(uploadImage(Buffer.from("img"), "j")).rejects.toThrow("nope");
  });

  it("rejects with generic error when no result and no error", async () => {
    upload_stream.mockImplementation((_opts, cb) => ({
      end: (_buf: Buffer) => cb(null, null),
    }));
    await expect(uploadImage(Buffer.from("img"), "j")).rejects.toThrow("Upload failed");
  });
});

describe("deleteImage", () => {
  it("calls cloudinary destroy", async () => {
    destroy.mockResolvedValueOnce({ result: "ok" });
    await deleteImage("pid");
    expect(destroy).toHaveBeenCalledWith("pid");
  });
});
