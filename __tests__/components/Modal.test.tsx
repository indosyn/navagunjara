/**
 * Tests for Modal component (jsdom shim for HTMLDialogElement).
 *
 * @module __tests__/components/Modal.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

beforeAll(() => {
  // jsdom doesn't implement showModal/close yet
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = jest.fn();
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = jest.fn();
  }
});

describe("Modal", () => {
  it("renders children", () => {
    render(<Modal open onClose={() => {}}><span>Inside</span></Modal>);
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("renders title and close button", () => {
    render(<Modal open onClose={() => {}} title="Hello"><div /></Modal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x"><div /></Modal>);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls showModal when opened, close when closed", () => {
    const showMock = HTMLDialogElement.prototype.showModal as jest.Mock;
    const closeMock = HTMLDialogElement.prototype.close as jest.Mock;
    showMock.mockClear();
    closeMock.mockClear();
    const { rerender } = render(<Modal open onClose={() => {}}><div /></Modal>);
    expect(showMock).toHaveBeenCalled();
    rerender(<Modal open={false} onClose={() => {}}><div /></Modal>);
    expect(closeMock).toHaveBeenCalled();
  });

  it("renders without title (no close button)", () => {
    render(<Modal open onClose={() => {}}><div>body</div></Modal>);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});
