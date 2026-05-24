/** @jest-environment node */
/**
 * Tests for `lib/logger.ts` — Pino server + clientLogger console mapping.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { createLogger, logger, clientLogger } from "@/lib/logger";

describe("createLogger", () => {
  it("returns a child logger with module label", () => {
    const log = createLogger("test");
    expect(typeof log.info).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("exports a default `logger` instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });
});

describe("clientLogger", () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it("info logs with prefix", () => {
    clientLogger("X").info("hi", { a: 1 });
    expect(infoSpy).toHaveBeenCalledWith("[X]", "hi", { a: 1 });
  });

  it("warn logs with prefix and empty meta default", () => {
    clientLogger("X").warn("hi");
    expect(warnSpy).toHaveBeenCalledWith("[X]", "hi", "");
  });

  it("error logs with prefix", () => {
    clientLogger("X").error("err");
    expect(errorSpy).toHaveBeenCalledWith("[X]", "err", "");
  });

  it("debug logs in non-prod", () => {
    clientLogger("X").debug("dbg");
    expect(debugSpy).toHaveBeenCalled();
  });
});
