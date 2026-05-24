/** @jest-environment node */
/**
 * Tests for jewelry & clothing search routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/services/jewelry.service", () => ({
  jewelryService: { search: jest.fn() },
}));
jest.mock("@/services/clothing.service", () => ({
  clothingService: { search: jest.fn() },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET as jewelrySearch } from "@/app/api/v1/jewelry/search/route";
import { GET as clothingSearch } from "@/app/api/v1/clothing/search/route";
import { jewelryService } from "@/services/jewelry.service";
import { clothingService } from "@/services/clothing.service";
import { makeRequest } from "../helpers/route";

describe("search routes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("jewelry search forwards params", async () => {
    (jewelryService.search as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await jewelrySearch(
      makeRequest("/api/v1/jewelry/search", { searchParams: { type: "NECKLACE", name: "x" } })
    );
    expect(res.status).toBe(200);
    expect(jewelryService.search).toHaveBeenCalledWith({ type: "NECKLACE", name: "x" }, 0, 10);
  });

  it("clothing search forwards params", async () => {
    (clothingService.search as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await clothingSearch(
      makeRequest("/api/v1/clothing/search", { searchParams: { type: "SAREE", gender: "FEMALE", name: "y" } })
    );
    expect(res.status).toBe(200);
    expect(clothingService.search).toHaveBeenCalledWith(
      { type: "SAREE", gender: "FEMALE", name: "y" },
      0,
      10
    );
  });

  it("jewelry search omits undefined", async () => {
    (jewelryService.search as jest.Mock).mockResolvedValueOnce({ content: [] });
    await jewelrySearch(makeRequest("/api/v1/jewelry/search"));
    expect(jewelryService.search).toHaveBeenCalledWith(
      { type: undefined, name: undefined },
      0,
      10
    );
  });
});
