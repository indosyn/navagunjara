/**
 * Tests for ReviewSection — load, summary, gate, submit flow.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

const useSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: () => useSession() }));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewSection } from "@/components/product/ReviewSection";

const fetchMock = jest.fn();
beforeAll(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

function mockReviews(payload: unknown) {
  fetchMock.mockResolvedValueOnce({ json: async () => ({ success: true, data: payload }) });
}

describe("ReviewSection", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    useSession.mockReset();
  });

  it("renders loading then empty state", async () => {
    useSession.mockReturnValue({ data: null });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() =>
      expect(screen.getByText(/No reviews yet/)).toBeInTheDocument()
    );
  });

  it("renders summary + list when reviews exist", async () => {
    useSession.mockReturnValue({ data: null });
    mockReviews({
      content: [
        {
          id: "r1",
          customerName: "Asha",
          rating: 5,
          title: "Great",
          comment: "Lovely",
          createdAt: "2024-01-01",
        },
      ],
      summary: { averageRating: 5, totalReviews: 1, distribution: { 5: 1 } },
    });
    render(<ReviewSection productId="1" />);
    await waitFor(() => expect(screen.getByText("Great")).toBeInTheDocument());
    expect(screen.getByText("Lovely")).toBeInTheDocument();
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
  });

  it("hides write button for non-USER", async () => {
    useSession.mockReturnValue({ data: { user: { role: "ADMIN" } } });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() => expect(screen.getByText(/No reviews yet/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Write a Review/ })).toBeNull();
  });

  it("shows form for USER, validates rating required", async () => {
    useSession.mockReturnValue({ data: { user: { role: "USER" } } });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() => screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: /Submit Review/ }));
    expect(await screen.findByText(/Please select a rating/)).toBeInTheDocument();
  });

  it("submits review and reloads", async () => {
    useSession.mockReturnValue({ data: { user: { role: "USER" } } });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() => screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: "5 stars" }));
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    mockReviews({ content: [], summary: { averageRating: 5, totalReviews: 1, distribution: { 5: 1 } } });
    fireEvent.click(screen.getByRole("button", { name: /Submit Review/ }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/reviews",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays server error on submit failure", async () => {
    useSession.mockReturnValue({ data: { user: { role: "USER" } } });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() => screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: "1 star" }));
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "ALREADY_REVIEWED" }),
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Review/ }));
    expect(await screen.findByText(/ALREADY_REVIEWED/)).toBeInTheDocument();
  });

  it("displays generic error on network failure", async () => {
    useSession.mockReturnValue({ data: { user: { role: "USER" } } });
    mockReviews({ content: [], summary: { averageRating: 0, totalReviews: 0, distribution: {} } });
    render(<ReviewSection productId="1" />);
    await waitFor(() => screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: /Write a Review/ }));
    fireEvent.click(screen.getByRole("button", { name: "1 star" }));
    fetchMock.mockRejectedValueOnce(new Error("net"));
    fireEvent.click(screen.getByRole("button", { name: /Submit Review/ }));
    expect(await screen.findByText(/Failed to submit review/)).toBeInTheDocument();
  });
});
