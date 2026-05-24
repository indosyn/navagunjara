/**
 * Tests for SearchFilters — pure controlled form.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { SearchFilters } from "@/components/product/SearchFilters";

function makeProps(overrides: Partial<React.ComponentProps<typeof SearchFilters>> = {}) {
  return {
    productType: "ALL" as const,
    onProductTypeChange: jest.fn(),
    minPrice: "",
    maxPrice: "",
    onMinPriceChange: jest.fn(),
    onMaxPriceChange: jest.fn(),
    sortBy: "newest",
    onSortChange: jest.fn(),
    inStockOnly: false,
    onInStockChange: jest.fn(),
    onApply: jest.fn(),
    onReset: jest.fn(),
    ...overrides,
  };
}

describe("SearchFilters", () => {
  it("renders all controls", () => {
    render(<SearchFilters {...makeProps()} />);
    expect(screen.getByLabelText(/All Products/)).toBeChecked();
    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max")).toBeInTheDocument();
    expect(screen.getByLabelText(/In Stock Only/)).not.toBeChecked();
  });

  it("calls onProductTypeChange when radio clicked", () => {
    const props = makeProps();
    render(<SearchFilters {...props} />);
    fireEvent.click(screen.getByLabelText(/Jewelry/));
    expect(props.onProductTypeChange).toHaveBeenCalledWith("JEWELRY");
  });

  it("calls onMinPriceChange and onMaxPriceChange", () => {
    const props = makeProps();
    render(<SearchFilters {...props} />);
    fireEvent.change(screen.getByPlaceholderText("Min"), { target: { value: "100" } });
    fireEvent.change(screen.getByPlaceholderText("Max"), { target: { value: "500" } });
    expect(props.onMinPriceChange).toHaveBeenCalledWith("100");
    expect(props.onMaxPriceChange).toHaveBeenCalledWith("500");
  });

  it("calls onSortChange when sort select changes", () => {
    const props = makeProps();
    render(<SearchFilters {...props} />);
    fireEvent.change(screen.getByDisplayValue("Newest First"), { target: { value: "price_asc" } });
    expect(props.onSortChange).toHaveBeenCalledWith("price_asc");
  });

  it("toggles inStockOnly", () => {
    const props = makeProps();
    render(<SearchFilters {...props} />);
    fireEvent.click(screen.getByLabelText(/In Stock Only/));
    expect(props.onInStockChange).toHaveBeenCalledWith(true);
  });

  it("fires onApply and onReset", () => {
    const props = makeProps();
    render(<SearchFilters {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(props.onApply).toHaveBeenCalled();
    expect(props.onReset).toHaveBeenCalled();
  });
});
