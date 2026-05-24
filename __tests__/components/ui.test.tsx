/**
 * Tests for UI primitive components.
 *
 * @module __tests__/components/ui.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { StarRating } from "@/components/ui/StarRating";
import { ToastContainer, showToast } from "@/components/ui/Toast";

// ─── Button ────────────────────────────────────────────────────────────────
describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
  });

  it("applies variant + size classes", () => {
    render(<Button variant="danger" size="lg">X</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[var(--color-error)]");
    expect(btn.className).toContain("text-base");
  });

  it("renders all variants", () => {
    for (const v of ["primary", "secondary", "danger", "ghost", "outline"] as const) {
      const { unmount } = render(<Button variant={v}>v</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    }
  });

  it("disables when loading", () => {
    render(<Button loading>X</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("fires onClick", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>X</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("respects disabled prop", () => {
    render(<Button disabled>X</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

// ─── Badge ─────────────────────────────────────────────────────────────────
describe("Badge", () => {
  it("renders label", () => {
    render(<Badge label="PENDING" />);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("uses status-specific color for known label", () => {
    render(<Badge label="DELIVERED" />);
    expect(screen.getByText("DELIVERED").className).toContain("bg-green-50");
  });

  it("falls back to gray for unknown label", () => {
    render(<Badge label="UNKNOWN" />);
    expect(screen.getByText("UNKNOWN").className).toContain("bg-gray-50");
  });
});

// ─── Input ─────────────────────────────────────────────────────────────────
describe("Input", () => {
  it("renders without label", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
  });

  it("renders label and links via htmlFor", () => {
    render(<Input label="Email" id="email" />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
  });

  it("shows required asterisk", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows error message and aria-invalid", () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("fires onChange", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("generates id when not provided", () => {
    render(<Input label="Foo" />);
    const input = screen.getByLabelText("Foo");
    expect(input.id).toBeTruthy();
  });
});

// ─── LoadingSkeleton ───────────────────────────────────────────────────────
describe("LoadingSkeleton", () => {
  it("renders default 8 skeleton items", () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBe(8);
  });

  it("respects count prop", () => {
    const { container } = render(<LoadingSkeleton count={3} />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBe(3);
  });
});

// ─── Pagination ────────────────────────────────────────────────────────────
describe("Pagination", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = render(<Pagination page={0} totalPages={1} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all pages when total <= 7", () => {
    render(<Pagination page={0} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();
  });

  it("renders ellipsis when total > 7 and far from edges", () => {
    render(<Pagination page={10} totalPages={20} onPageChange={() => {}} />);
    expect(screen.getAllByText("…").length).toBeGreaterThanOrEqual(1);
  });

  it("disables prev on first page, next on last", () => {
    const { rerender } = render(<Pagination page={0} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    rerender(<Pagination page={4} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange when clicking a page", () => {
    const onChange = jest.fn();
    render(<Pagination page={0} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("marks current page with aria-current", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
  });
});

// ─── StarRating ────────────────────────────────────────────────────────────
describe("StarRating", () => {
  it("renders 5 stars by default", () => {
    render(<StarRating rating={3} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("respects maxStars", () => {
    render(<StarRating rating={2} maxStars={3} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("non-interactive stars are disabled", () => {
    render(<StarRating rating={3} />);
    expect(screen.getAllByRole("button")[0]).toBeDisabled();
  });

  it("calls onRate when interactive star clicked", () => {
    const onRate = jest.fn();
    render(<StarRating rating={0} interactive onRate={onRate} />);
    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[2]);
    expect(onRate).toHaveBeenCalledWith(3);
  });

  it("does NOT call onRate when not interactive", () => {
    const onRate = jest.fn();
    render(<StarRating rating={0} onRate={onRate} />);
    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[2]);
    expect(onRate).not.toHaveBeenCalled();
  });

  it("uses singular label for 1 star", () => {
    render(<StarRating rating={1} />);
    expect(screen.getByLabelText("1 star")).toBeInTheDocument();
    expect(screen.getByLabelText("2 stars")).toBeInTheDocument();
  });
});

// ─── Toast ─────────────────────────────────────────────────────────────────
describe("Toast", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it("renders nothing when no toasts", () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a toast when showToast is called", () => {
    render(<ToastContainer />);
    act(() => { showToast("Saved!"); });
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("removes toast after 2.8s", () => {
    render(<ToastContainer />);
    act(() => { showToast("Bye"); });
    expect(screen.getByText("Bye")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(2500); });
    expect(screen.getByText("Bye")).toBeInTheDocument(); // still visible, exiting
    act(() => { jest.advanceTimersByTime(300); });
    expect(screen.queryByText("Bye")).not.toBeInTheDocument();
  });
});
