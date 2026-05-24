/**
 * Tests for AdminNav active-link logic.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

const usePathname = jest.fn();
jest.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

import { render, screen } from "@testing-library/react";
import { AdminNav } from "@/components/admin/AdminNav";

describe("AdminNav", () => {
  it("marks Dashboard active on exact /admin", () => {
    usePathname.mockReturnValue("/admin");
    render(<AdminNav />);
    const dash = screen.getByRole("link", { name: /Dashboard/ });
    expect(dash.className).toMatch(/bg-amber/);
  });

  it("marks Products active on /admin/products/123", () => {
    usePathname.mockReturnValue("/admin/products/123");
    render(<AdminNav />);
    const prod = screen.getByRole("link", { name: /Products/ });
    expect(prod.className).toMatch(/bg-amber/);
  });

  it("does not mark Dashboard active on nested /admin/orders", () => {
    usePathname.mockReturnValue("/admin/orders");
    render(<AdminNav />);
    const dash = screen.getByRole("link", { name: /Dashboard/ });
    expect(dash.className).not.toMatch(/bg-amber/);
  });

  it("renders Back to Store link", () => {
    usePathname.mockReturnValue("/admin");
    render(<AdminNav />);
    expect(screen.getByText("Back to Store")).toBeInTheDocument();
  });
});
