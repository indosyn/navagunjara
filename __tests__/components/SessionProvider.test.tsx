/**
 * Tests for SessionProvider — wrapper around next-auth provider.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-auth-provider">{children}</div>
  ),
}));

import { render, screen } from "@testing-library/react";
import { SessionProvider } from "@/components/providers/SessionProvider";

describe("SessionProvider", () => {
  it("wraps children in next-auth provider", () => {
    render(
      <SessionProvider>
        <span data-testid="child">hi</span>
      </SessionProvider>
    );
    expect(screen.getByTestId("next-auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
